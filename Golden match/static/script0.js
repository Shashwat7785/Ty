
const matches = {
    "ENFJ": "INFP",
    "INTP": "ENTJ",
    "INFP": "ENFJ",
    "ENTP": "INFJ",
    "ENFP": "INTJ",
    "ISTJ": "ESFJ",
    "ISFJ": "ESFP",
    "ESTJ": "ISFP",
    "ESFJ": "ISFP",
    "ISTP": "ESTJ",
    "ISFP": "ESFJ",
    "ESTP": "ISFJ",
    "ESFP": "ISFJ",
    "INFJ": "ENTP", // Added based on your previous list logic
    "INTJ": "ENFP", // Added based on your previous list logic
    "ENTJ": "INTP"  // Added based on your previous list logic
};
    // Add all 16 types here...

document.getElementById('quiz-form').addEventListener('submit', function(e) {
    e.preventDefault();

    // Get values from form
    const q1 = document.querySelector('input[name="q1"]:checked').value;
    const q2 = document.querySelector('input[name="q2"]:checked').value;
    const q3 = document.querySelector('input[name="q3"]:checked').value;
    const q4 = document.querySelector('input[name="q4"]:checked').value;

    const finalType = q1 + q2 + q3 + q4;

    // Show Results
    document.getElementById('mbti-type').innerText = finalType;
    document.getElementById('match-suggestion').innerText = "Your best matches are: " + (matches[finalType] || "Finding matches...");
    document.getElementById('result-area').classList.remove('hidden');
});