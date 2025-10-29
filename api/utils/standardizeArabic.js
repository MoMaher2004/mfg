const standardizeArabic = (...text) => {
    if (text.length == 0) return ''
    text = text.join(' ')
    return text.replaceAll("أ","ا")
    .replaceAll("إ","ا")
    .replaceAll("آ","ا")
    .replaceAll("ى","ي")
    .replaceAll("ؤ","و")
    .replaceAll("ئ","ء")
    .replaceAll("ة","ه")
    .replaceAll("ذ","ز")
    .replaceAll("ض","ظ")
}

module.exports = {standardizeArabic}