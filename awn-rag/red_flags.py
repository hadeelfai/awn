import re

_ARABIC_DIACRITICS = re.compile(r"[ً-ْـ]")


def normalize(text: str) -> str:
    """Unify Arabic letter variants so one pattern matches common spellings."""
    text = _ARABIC_DIACRITICS.sub("", text)
    text = re.sub("[أإآ]", "ا", text)
    text = text.replace("ة", "ه").replace("ى", "ي").replace("ؤ", "و").replace("ئ", "ي")
    text = text.translate(str.maketrans("٠١٢٣٤٥٦٧٨٩", "0123456789"))
    return re.sub(r"\s+", " ", text).strip().lower()


EMERGENCY_PATTERNS = re.compile(
    # English
    r"chest (?:pain|hurts|tight|pressure)|(?:pain|tightness|pressure) in (?:my |the )?chest|chest feels tight|"
    r"(?:trouble|difficulty|can'?t|cannot) breath|short(?:ness)? of breath|not breathing|"
    r"heavy bleeding|bleeding (?:a lot|won'?t stop|heavily)|"
    r"stroke|face (?:is )?drooping|weakness on one side|slurred speech|can'?t move (?:my|his|her) (?:arm|leg|side)|"
    r"unconscious|passed out|fainted|loss of consciousness|lost consciousness|"
    r"seizure|convuls|anaphyla|(?:throat|tongue|lips?|face) (?:is )?swell|swollen (?:throat|tongue|lips?)|"
    r"overdose|poison|"
    # Arabic (normalized: ا not أ, ه not ة)
    r"(?:الم|وجع|ضيق|كتمه|ضغط|حرقان) (?:في |ب)?(?:ال)?صدر|صدري (?:يعورني|يوجعني|يالمني|مكتوم|ضايق)|كتمه|"
    r"(?:ضيق|صعوبه) (?:في |ب)?(?:ال)?(?:تنفس|نفس)|نفسي (?:ضايق|مقطوع|يتقطع)|(?:ما|مو|لا) (?:اقدر|يقدر|تقدر|قادر|يستطيع|استطيع|تستطيع) (?:ا|ي|ت)?(?:تنفس|اتنفس)|نفسه يصفر|يختنق|اختناق|"
    r"نزيف (?:شديد|قوي|كثير)|ينزف (?:كثير|بقوه)|(?:الدم|النزيف) ما (?:وقف|يوقف)|"
    r"جلطه|سكته|وجه(?:ه|ها|ي)? (?:مايل|معوج|طايح)|(?:ما|مو) (?:يقدر|تقدر|اقدر) (?:يحرك|تحرك|احرك)|ثقل (?:في )?(?:الكلام|لسان)|"
    r"اغمي (?:عليه|عليها|علي)|اغماء|فاقد الوعي|فقدان (?:ال)?وعي|ما يصحي|ما يستجيب|طاح (?:و|ما)|"
    r"تشنج|تشنجات|نوبه صرع|"
    r"(?:انتفخ|ورم|تورم) (?:وجه|لسان|حلق|شفايف|شفاي)|حساسيه شديده|"
    r"جرعه زايده|بلع(?:ت|و)? (?:دوا|ادويه|حبوب|كلوركس|منظف|مبيض|بطاريه)|تسمم|"
    r"حرارته? (?:4[0-9]|39)|"
    # Fever in a baby under 3 months is an emergency on its own.
    r"(?:رضيع|مولود|عمر(?:ه|ها) (?:[0-9]{1,2} (?:يوم|ايام|اسبوع|اسابيع)|[0-3] (?:شهر|شهور|اشهر)|اسبوع|اسبوعين|شهر|شهرين|ثلاث اشهر)|newborn|"
    r"\b\d{1,2}[- ](?:day|week)s?[- ]old|\b[0-3][- ]months?[- ]old).{0,40}(?:حراره|حرارته|سخونه|مسخن|fever|temperature)"
)

SELF_HARM_PATTERNS = re.compile(
    r"kill(?:ing)? (?:my|him|her)?self|suicid|\bend (?:my life|it all)|want to die|hurt(?:ing)? myself|self[- ]harm|"
    r"انتحر|انتحار|اقتل نفسي|(?:ابي|ابغي|ودي|اريد) اموت|(?:ابي|ابغي|اريد) انهي حياتي|اذي نفسي|ايذاء النفس|"
    r"ما (?:ابي|ابغي) اعيش|تعبت من الحياه|الموت (?:احسن|ارحم)"
)

GENERAL_INFORMATION_QUESTION = re.compile(
    r"^\s*(?:what\s+(?:is|are|causes?|does)\b|explain\b|define\b|tell\s+me\s+about\b|"
    r"symptoms\s+of\b|information\s+about\b|"
    r"(?:ما|وش|ايش|شنو) (?:هو|هي|معني|اعراض|اسباب|سبب|علامات)\b|اشرح\b|عرف\b|حدثني عن\b)"
)
PERSONAL_SYMPTOM_CONTEXT = re.compile(
    r"\b(?:i|i'?m|my|me|he|she|his|her|they|my (?:son|daughter|baby|father|mother|dad|mom))\b|"
    r"(?:عندي|اعاني|اشعر|احس|لدي|صدري|نفسي|امي|ابوي|ابي|ابويه|طفلي|ابني|بنتي|ولدي|زوجي|زوجتي|اخوي|اختي|جدي|جدتي)"
)


def red_flag(text: str):
    """Return 'self_harm', 'emergency', or None. Runs before any model call."""
    t = normalize(text)
    if SELF_HARM_PATTERNS.search(t):
        return "self_harm"
    if not EMERGENCY_PATTERNS.search(t):
        return None
    if GENERAL_INFORMATION_QUESTION.search(t) and not PERSONAL_SYMPTOM_CONTEXT.search(t):
        return None
    return "emergency"


FEVER = re.compile(r"حراره|حرارته|سخونه|مسخن|fever|temperature")
_INFANT_WORDS = re.compile(r"رضيع|مولود|newborn|infant")
_AGE = re.compile(
    r"(?:عمر(?:ه|ها|ي)?|aged?)\s*(\d{1,3})\s*(يوم|ايام|اسبوع|اسابيع|شهر|شهور|اشهر|days?|weeks?|months?)?|"
    r"\b(\d{1,3})[- ](day|week|month|year)s?[- ]old"
)
_CHILD_WORDS = re.compile(r"طفل|طفلي|طفلتي|\b(?:child|kid|toddler)\b")


def age_group(text: str):
    """'infant' (<1y), 'child' (<14y), 'adult', or None when the text doesn't say."""
    t = normalize(text)
    if re.search(r"عمر(?:ه|ها) (?:يوم|يومين|اسبوع|اسبوعين|شهر|شهرين)\b", t):
        return "infant"
    match = _AGE.search(t)
    if match:
        number = int(match.group(1) or match.group(3))
        unit = match.group(2) or match.group(4) or ""
        if any(word in unit for word in ("يوم", "ايام", "اسبوع", "اسابيع", "day", "week")):
            return "infant"
        if any(word in unit for word in ("شهر", "شهور", "اشهر", "month")):
            return "infant" if number < 12 else "child"
        return "child" if number < 14 else "adult"
    if _INFANT_WORDS.search(t):
        return "infant"
    if _CHILD_WORDS.search(t):
        return "child"
    return None


def has_fever(text: str) -> bool:
    return bool(FEVER.search(normalize(text)))
