let allMatches = [];

// --- 1. View Switcher ---
function showAuth(type) {
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const tabLogin = document.getElementById('tab-login');
    const tabSignup = document.getElementById('tab-signup');

    if (type === 'login') {
        loginForm.classList.remove('hidden');
        signupForm.classList.add('hidden');
        tabLogin.classList.add('active');
        tabSignup.classList.remove('active');
    } else {
        loginForm.classList.add('hidden');
        signupForm.classList.remove('hidden');
        tabLogin.classList.remove('active');
        tabSignup.classList.add('active');
    }
}

// --- 2. Login & Transition ---
document.getElementById('login-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const password = document.getElementById('login-password').value;
    const email = document.getElementById('login-email').value.trim().toLowerCase();
    console.log("Sending Login Request for:", email);

    console.log("Attempting login...");

    fetch('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    })
    .then(res => {
        if (!res.ok) throw new Error("Login Failed");
        return res.json();
    })
    .then(data => {
        console.log("Login success! Data:", data);
        
        // UI Transition
        document.getElementById('auth-container').classList.add('hidden');
        document.getElementById('quiz-container').classList.remove('hidden');
        document.getElementById('nav-user-info').classList.remove('hidden');
        document.getElementById('display-username').innerText = "Hi, " + data.username;

        if (data.mbti_type) {
            console.log("User already has type, fetching matches...");
            fetchMatches(data.mbti_type);
        }
    })
    .catch(err => alert(err.message));
});
// --- 2.5 Sign Up Logic (The missing part) ---
document.getElementById('signup-form').addEventListener('submit', function(e) {
    e.preventDefault();
    console.log("Register button clicked! Collecting data...");

    const username = document.getElementById('signup-username').value;
    const email = document.getElementById('signup-email').value;
    const gender = document.getElementById('signup-gender').value;
    const bio = document.getElementById('signup-bio').value;
    const interests = document.getElementById('signup-interests').value;
    const password = document.getElementById('signup-password').value;
    // Final check before sending to server
    if (!email.endsWith("@mnit.ac.in")) {
        alert("Registration restricted to MNIT students only (@mnit.ac.in).");
        return; // Stops the function here
    }

    fetch('/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            username, 
            email, 
            gender, 
            bio, 
            interests, 
            password 
        })
    })
    .then(res => res.json())
    .then(data => {
        console.log("Server response:", data);
        alert(data.message);
        if (data.message === "Registered successfully!") {
            showAuth('login'); // Switch to login tab automatically
        }
    })
    .catch(err => {
        console.error("Registration Error:", err);
        alert("Could not connect to server. Check your terminal.");
    });
});

// --- 3. Quiz Submission ---
document.getElementById('quiz-form').addEventListener('submit', function(e) {
    e.preventDefault();
    console.log("Processing 12-question quiz results...");

    // Helper function to get majority letter
    function getMajority(names, optionA, optionB) {
        let countA = 0;
        names.forEach(name => {
            const val = document.querySelector(`input[name="${name}"]:checked`).value;
            if (val === optionA) countA++;
        });
        return countA >= 2 ? optionA : optionB; // 2 or 3 wins
    }

    // Calculate each trait
    const EorI = getMajority(['ei1', 'ei2', 'ei3'], 'E', 'I');
    const SorN = getMajority(['sn1', 'sn2', 'sn3'], 'S', 'N');
    const TorF = getMajority(['tf1', 'tf2', 'tf3'], 'T', 'F');
    const JorP = getMajority(['jp1', 'jp2', 'jp3'], 'J', 'P');

    const finalType = EorI + SorN + TorF + JorP;
    console.log("Calculated 12-question Type:", finalType);

    // Save to server


    fetch('/save_type', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mbti_type: finalType })
    })
    .then(res => res.json())
    .then(data => {
        console.log("Type saved! Fetching matches for:", finalType);
        fetchMatches(finalType);
    });
});

// --- 4. Matching & Rendering ---
function fetchMatches(type) {
    console.log("Requesting matches from server...");
    fetch(`/get_matches/${type}`)
    .then(res => res.json())
    .then(matches => {
        console.log("Matches received:", matches);
        allMatches = matches;
        
        // Show the UI elements
        document.getElementById('quiz-form').classList.add('hidden');
        document.getElementById('filter-section').classList.remove('hidden');
        document.getElementById('result-area').classList.remove('hidden');
        document.getElementById('mbti-type').innerText = type;

        renderCards(allMatches);
    })
    .catch(err => console.error("Match Fetch Error:", err));
}

function renderCards(data) {
    const matchArea = document.getElementById('match-suggestion');
    if (data.length === 0) {
        matchArea.innerHTML = "<p>No matches found yet.</p>";
        return;
    }

    let html = "<div class='match-grid'>";
    data.forEach(m => {
        html += `
            <div class="match-card">
                <span class="type-badge">${m.type}</span>
                <strong>${m.username} (${m.gender})</strong>
                <p class="match-bio">${m.bio}</p>
                <div class="interest-tags">
                    ${m.interests.split(',').map(i => `<span class="tag">${i.trim()}</span>`).join('')}
                </div>
                <a href="mailto:${m.email}" class="email-link">📧 Contact</a>
            </div>`;
    });
    html += "</div>";
    matchArea.innerHTML = html;
    console.log("Cards rendered successfully.");
}
function retakeTest() {
    console.log("Resetting quiz for a new attempt...");

    // 1. Hide the result areas and filters
    document.getElementById('result-area').classList.add('hidden');
    document.getElementById('filter-section').classList.add('hidden');

    // 2. Show the quiz container and form
    document.getElementById('quiz-container').classList.remove('hidden');
    const quizForm = document.getElementById('quiz-form');
    quizForm.classList.remove('hidden');

    // 3. Clear all previous radio button selections
    quizForm.reset();

    // 4. Scroll the user smoothly back to the start of the quiz
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function applyFilters() {
    const genderEl = document.getElementById('gender-filter');

    // 1. Safety Check: If elements don't exist yet, stop the function
    if (!genderEl) {
        console.warn("Filtering elements not found in DOM yet.");
        return;
    }

    const selectedGender = genderEl.value;

    
    console.log(`Filtering for: ${selectedGender}"`);

    const filtered = allMatches.filter(m => {
        // Gender Match (Normalize for safety)
        const matchesGender = (selectedGender === "All" || 
                               (m.gender && m.gender.toLowerCase() === selectedGender.toLowerCase()));

      

        return matchesGender;
    });

    renderCards(filtered);
}
