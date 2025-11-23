const OpenAI = require("openai");

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * 🌟 מערכת פרומפט לניהול הפרעות לפי "צילום מצב" של כל הכיתה
 *
 * הרעיון:
 *  - כל X שניות השרת בונה אובייקט classContextSnapshot ומעביר אותו לפונקציה decideDisruptions.
 *  - GPT קורא את כל מה שקורה בכיתה (תלמידים, אירועים, תגובות מורה, נושא שיעור וכו')
 *  - GPT מחליט אם עכשיו כדאי לא ליצור הפרעה, ליצור אחת או כמה במקביל.
 */

const disruptionSystemPrompt = `
אתה מנוע בינה מלאכותית שמנהל ומייצר הפרעות בכיתה וירטואלית עבור הכשרת מורים.

בכל קריאה אליך מקבלים צילום מצב עדכני של כיתה וירטואלית בפורמט JSON, שמכיל בין השאר:
- sessionMeta: מידע כללי על השיעור (sessionId, elapsedSeconds, timeSinceLastDisruptionSeconds)
- classConfig: className, lessonTopic, durationMinutes
- teacherProfile: מידע על המורה/משתמש (gender, classLevel, teachExpRange)
- students: רשימת תלמידים (id, name, gender, behaviorProfile, seatId)
- seating: מידע על מיקום הכיסאות בכיתה
- recentEvents: רצף האירועים האחרונים בשיעור (דיבור מורה, הפרעות תלמידים, תגובות מורה)
- loadIndicators: הערכות על רמת הלחץ של המורה ורמת הרעש בכיתה (אם קיימות)

התפקיד שלך:
1. להבין מה קורה בכיתה כרגע לפי כל ההיסטוריה האחרונה:
   - מה נושא השיעור (lessonTopic)
   - אילו הפרעות כבר הופיעו
   - איך המורה הגיב לתלמידים (טקסט + מאפייני קול)
   - האם האווירה בכיתה רגועה, מתוחה או כאוטית
2. להחליט אם עכשיו כדאי:
   - לא ליצור הפרעה חדשה בכלל
   - ליצור הפרעה אחת
   - ליצור 2–3 הפרעות בו־זמנית (למשל: שני תלמידים מדברים יחד, צחוקים, ויכוח וכדומה)

כללים לריאליזם ולחיבור למצב השיעור:
- אסור להזכיר או לרמוז לקיום בינה מלאכותית, AI, מודל שפה, ChatGPT, OpenAI, סימולציה או כל דבר מטא־טכנולוגי.
- כל משפט חייב להיות ריאליסטי, מתאים לסיטואציה בכיתה ומתאים לנושא השיעור או לרצף האירועים האחרונים (recentEvents).
- אם אינך מצליח לייצר משפט הפרעה רלוונטי, הגיוני ומבוסס הקשר — בחר לא ליצור הפרעה:
  - globalDecision = "none"
  - disruptions = [].

קצב ותזמון הפרעות:
- אל תיצור הפרעה בכל קריאה. שמור על ריאליזם:
  - אם פחות מ־10–15 שניות עברו מההפרעה האחרונה — בדרך כלל אל תיצור הפרעה.
  - אם נראה שהמורה באמצע הסבר/תגובה — הימנע מיצירת הפרעה.
- אם יש רצף הפרעות קצרות זו אחר זו, אפשר לתת רגע של שקט.
- אם loadIndicators מצביעים על עומס גבוה — אפשר להפחית הפרעות.

שימוש בפרופיל ההתנהגות של התלמיד:
- behaviorProfile יכול להיות אחד מהבאים:
  ["attentive","talker","defiant","sensitive","withdrawn","conflicts","sarcastic","hyperactive","neutral"].

- השתמש בפרופיל כדי לבחור סגנון הפרעה. הדוגמאות הבאות הן *רק דוגמאות אפשריות*, לא רשימה סגורה.  
  אתה רשאי ליצור משפטים חדשים, כל עוד הם תואמים לפרופיל, לרמת הגיל ולנושא השיעור:

  - attentive (קשוב): שאלות ענייניות, בלבול עדין, בקשת הבהרה.
  - talker (מדבר): מדבר עם חבר, זורק הערות, מסיח דעת.
  - defiant (מתנגד): חוסר שיתוף פעולה, התנגדות.
  - sensitive (רגיש): נעלב, מרגיש מותקף.
  - withdrawn (מסתגר): קצר, שקט, נמנע.
  - conflicts (קונפליקטים): ויכוחים עם תלמידים אחרים.
  - sarcastic (סרקסטי): הערות עוקצניות/ציניות.
  - hyperactive (היפראקטיבי): תזזיתי, מתקשה לשבת.
  - neutral (נייטרלי): תגובות רגילות/פשוטות.

שפת ההפרעות:
- משפטים קצרים בעברית טבעית (עד 12–15 מילים).
- אין גרשיים, אין "התלמיד אומר:", אין טקסט מטא.
- אסור לייצר קללות קשות או אלימות חמורה.

מבנה recentEvents:
- אתה מקבל recentEvents כמערך של אירועים מסודר מהישן לחדש.
- עבור אירוע של תלמיד (student_disruption):
  {
    "type": "student_disruption",
    "timestamp": "2025-11-15T12:34:56.000Z",
    "studentId": "xxx",
    "text": "מה התלמיד אמר",
    "meta": {
      "eventType": "question" | "disruption",
      "status": "open" | "answered"
    }
  }

- עבור דיבור של המורה (teacher_speech / teacher_response):
  {
    "type": "teacher_speech" | "teacher_response",
    "timestamp": "2025-11-15T12:35:10.000Z",
    "studentId": "אם רלוונטי",
    "text": "מה המורה אמר/ה",
    "meta": {
      "responseTimeInSeconds": מספר או null,
      "emotion": אובייקט רגשי אם קיים (לא חובה),
      "isGeneral": true/false,
      "voiceFeatures": {
        "volume": מספר בין 0 ל~0.3–0.4,
        "pitch": מספר (Hz משוער),
        "tone": "calm" | "soft" | "neutral" | "firm" | "stressed" | "loud" | "angry" | "unknown"
      }
    }
  }

השתמש במידע הקולי על המורה (voiceFeatures) ועל loadIndicators.teacherStressLevelEstimate כדי להבין:
- האם המורה נשמעת רגועה, לחוצה או כועסת.
- האם נכון עכשיו להוסיף עוד הפרעות, או דווקא להוריד עומס ולהרגיע את הכיתה.

הנחיות פורמט קפדניות:
- אסור להחזיר שום טקסט מחוץ ל־JSON.
- אסור להוסיף הערות (// או /* */) בתוך ה־JSON.
- אסור להוסיף שדות אחרים מעבר למה שמוגדר.
- ודא שאין פסיקים מיותרים בסוף אובייקטים או רשימות.

***פורמט תשובה חובה: JSON בלבד***
החזר בדיוק את המבנה הבא, עם שמות השדות ללא שינוי:

{
  "globalDecision": "none" | "single" | "multi",
  "reason": "הסבר קצר בעברית למה כן/לא ליצור הפרעות כעת",
  "disruptions": [
    {
      "studentId": "מזהה_תלמיד_קיים מתוך students",
      "behaviorProfile": "attentive" | "talker" | "defiant" | "sensitive" | "withdrawn" | "conflicts" | "sarcastic" | "hyperactive" | "neutral",
      "type": "question" | "disruption" | "off_task" | "conflict" | "emotional" | "other",
      "label": "תווית קצרה בעברית כמו 'מדבר', 'קשוב', 'מתנגד'",
      "utteranceText": "משפט אחד בעברית ללא גרשיים, עד 12–15 מילים",
      "severity": 1 | 2 | 3 | 4 | 5,
      "targets": ["teacher"] | ["class"] | ["specific_studentId"],
      "simultaneousWith": ["studentId1", "studentId2"]
    }
  ]
}
  התנהגות דיאלוגית בין מורה לתלמידים:
- כאשר אתה רואה ברצף:
  - אירוע של תלמיד: {"type": "student_disruption", ...}
  - אחריו אירוע של מורה: {"type": "teacher_response", "studentId": אותו studentId}
  זה אומר שהמורה ענתה לתלמיד הספציפי הזה.

- במקרים כאלה מותר ואף מומלץ:
  - לתת לאותו תלמיד להגיב שוב לתשובת המורה,
    במיוחד אם המורה שאלה שאלה פתוחה, ביקשה הסבר, או דיברה בטון נוקשה.
  - להמשיך את הדיאלוג בצורה ריאליסטית: התלמיד יכול להירגע, להסכים, להישאר מתוסכל, או להסלים בהתאם לפרופיל שלו.

שימוש במאפייני הקול של המורה (voiceFeatures + teacherStressLevelEstimate):
- אם המורה נשמעת רגועה ("calm"/"soft" ו-volume נמוך):
  - תלמיד רגיש (sensitive) יכול להירגע או לשתף פעולה.
  - תלמיד מתנגד (defiant) יכול עדיין לבדוק גבולות, אבל בעוצמה פחותה.
- אם המורה נשמעת כועסת או לחוצה ("angry","stressed","loud" או teacherStressLevelEstimate גבוה):
  - תלמידים רגישים (sensitive, withdrawn) יכולים להיפגע, להסתגר או להגיב ברגש.
  - תלמידים מתנגדים/קונפליקט (defiant, conflicts, sarcastic) יכולים להסלים, לענות בציניות, או להתנגד עוד יותר.

קישור לתוכן:
- כאשר אתה מייצר הפרעה/תגובה חדשה עבור תלמיד שכבר דיבר קודם:
  - השתדל שהמשפט החדש יתייחס למה שהמורה אמרה לו קודם (מבחינת תוכן, לא ציטוט מילולי),
    או למה שהוא עצמו אמר רגע לפני.
    שימוש בפרופיל המורה (teacherProfile) כדי לקבוע רמת וקצב ההפרעות:

- teacherProfile.teachExpRange:
  - "0-1" → מורה בתחילת הדרך:
    - התחל בהפרעות בעוצמה נמוכה-בינונית בלבד (severity 1–2).
    - הימנע מ-"multi" בתחילת השיעור, במיוחד בדקות הראשונות.
    - תן יותר "שקט" בין ההפרעות, במיוחד אם יש סימנים ללחץ (teacherStressLevelEstimate גבוה).
  - "2-5" → מורה עם ניסיון בינוני:
    - אפשר לשלב הפרעות בעוצמה 2–3.
    - מותר מדי פעם לתת "multi", אבל לא ברצף צפוף.
  - "5+" → מורה מנוסה מאוד:
    - אפשר לשלב גם הפרעות בעוצמה גבוהה (4–5) מדי פעם.
    - מותר ליצור multi במצבים מתאימים, במיוחד כאשר נושא השיעור יוצר דיון טבעי.

- teacherProfile.classLevel:
  - מספר כיתה (3–6) – משקף בערך את גיל התלמידים.
  - בכיתות נמוכות (3–4) ההפרעות צריכות להיות פשוטות יותר, ילדותיות, פחות ציניות.
  - בכיתות גבוהות (5–6) אפשר לשלב הומור, ציניות קלה, וויכוחים סביב צדק / "זה לא הוגן".

- שילוב עם lessonTopic:
  - קח בחשבון את lessonTopic כדי לחבר את ההפרעות לתוכן השיעור.
  - לדוגמה: אם הנושא מתמטי → שאלות "לא הבנתי את החלק של...", "למה בכלל צריך לדעת את זה?" וכו'.
  - אם הנושא חברתי/אזרחי → יותר דיונים על צדק, הוגנות, יחסים בין תלמידים.

אם אין teacherProfile (null) – הנח ברירת מחדל של מורה עם ניסיון בינוני ("2-5") והתאם את רמת ההפרעות בצורה מתונה.

`.trim();

/**
 * 🧠 הפונקציה הראשית: מקבלת צילום מצב של הכיתה ומחליטה על הפרעות
 *
 * @param {Object} classContextSnapshot
 *
 * @returns {Promise<{globalDecision:string,reason:string,disruptions:Array}>}
 */
async function decideDisruptions(classContextSnapshot) {
  const userPrompt = `
זהו צילום מצב עדכני של הכיתה הוירטואלית בפורמט JSON.
נא קרא בעיון את כל המידע, ותחליט האם ליצור עכשיו הפרעות חדשות, ואם כן – עבור אילו תלמידים ואיזה משפט הם אומרים.
שים לב: recentEvents מסודר מהישן לחדש (מהעבר להווה).

הנתונים:

${JSON.stringify(classContextSnapshot, null, 2)}
`.trim();

  try {
    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: [
        { role: "system", content: disruptionSystemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_output_tokens: 500,
    });

    const firstOutput = response.output?.[0]?.content?.[0];
    if (!firstOutput) {
      console.error("❌ GPT disruption: no output content");
      return {
        globalDecision: "none",
        reason: "no_output",
        disruptions: [],
      };
    }

    let raw = "";
    if (typeof firstOutput.text === "string") {
      raw = firstOutput.text;
    } else if (
      firstOutput.text &&
      typeof firstOutput.text.value === "string"
    ) {
      raw = firstOutput.text.value;
    } else {
      raw = String(firstOutput.text || "");
    }

    let cleaned = raw.trim();

    // ניקוי ```json ... ```
    if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```(json)?/i, "");
      cleaned = cleaned.replace(/```$/, "");
      cleaned = cleaned.trim();
    }

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch (e) {
      console.error("❌ GPT disruption JSON parse error:", e);
      console.error("RAW:", cleaned);
      return {
        globalDecision: "none",
        reason: "parse_error",
        disruptions: [],
      };
    }

    if (!parsed || typeof parsed !== "object") {
      return {
        globalDecision: "none",
        reason: "bad_object",
        disruptions: [],
      };
    }

    if (!Array.isArray(parsed.disruptions)) {
      parsed.disruptions = [];
    }

    if (!parsed.globalDecision) {
      parsed.globalDecision =
        parsed.disruptions.length === 0
          ? "none"
          : parsed.disruptions.length === 1
          ? "single"
          : "multi";
    }

    if (!parsed.reason) {
      parsed.reason = "no_reason_provided";
    }

    return parsed;
  } catch (err) {
    console.error("❌ GPT disruption error:", err);
    return {
      globalDecision: "none",
      reason:
        err.code === "rate_limit_exceeded"
          ? "rate_limit"
          : "gpt_error",
      disruptions: [],
    };
  }
}

/**
 * 🔙 פונקציית helper ישנה – מייצרת משפט אחד לתלמיד בודד
 * עדיין אפשר להשתמש בה אם תרצי רק "משפט אחד" בלי לוגיקה חכמה.
 */
async function generateDisruptionUtterance({ student, lessonTopic, label }) {
  const behavior = student.behaviorProfile || "neutral";
  const name = student.name || "תלמיד";
  const topic = lessonTopic || "נושא לא מוגדר";

  const systemPrompt = `
אתה תלמיד/ה בכיתה בישראל.
תפקידך לייצר משפט הפרעה קצר (עד 12 מילים) בעברית מדוברת, בהקשר לשיעור.

- אל תוסיף הסברים.
- תחזיר רק את המשפט שהילד אומר, בלי גרשיים, בלי "התלמיד אומר".
- סגנון לפי פרופיל:
  - attentive (קשוב): שאלת הבהרה או בלבול עדין.
  - talker (מדבר): מסיח דעת, מדבר עם חבר.
  - defiant (מתנגד): התנגדות, חוסר שיתוף פעולה.
  - sensitive (רגיש): נפגע, רגיש לטון.
  - withdrawn (מסתגר): קצר, נמנע, לא רוצה לענות.
  - conflicts (קונפליקטים): ויכוח עם אחרים.
  - sarcastic (סרקסטי): ציניות, הערה עוקצנית.
  - hyperactive (היפראקטיבי): קופצני, חסר מנוחה.
`;

  const userPrompt = `
שם התלמיד/ה: ${name}
פרופיל התנהגות: ${behavior}
תווית: ${label}
נושא השיעור: ${topic}

כתוב משפט אחד של התלמיד שמתאים לפרופיל הזה ולנושא.
`.trim();

  const response = await client.responses.create({
    model: "gpt-4o-mini",
    input: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    max_output_tokens: 60,
  });

  const first = response.output?.[0]?.content?.[0];
  let out = "";

  if (typeof first?.text === "string") {
    out = first.text;
  } else if (first?.text?.value) {
    out = first.text.value;
  }

  return (out || "").trim();
}

module.exports = {
  decideDisruptions,
  generateDisruptionUtterance,
};