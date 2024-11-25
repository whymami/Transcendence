const username = localStorage.getItem("username");

if (!username) {
    showToast("error", "You need to log in to access this page.");
    history.pushState({}, "", "/login");
    urlLocationHandler();
}

async function verifyEmail() {
    const codeInput = document.getElementById("verificationCode");
    const btn = document.getElementsByClassName("verify-btn")[0];
    const code = codeInput.value;
    const verificationError = document.getElementById("verificationError");

    if (code.length != 6) {
        showToast("error", "Invalid verify code");
        codeInput.focus();
    }

    try {
        btn.textContent = "Verifying...";
        btn.disabled = true;
        codeInput.disabled = true;
        const response = await fetch("/api/verify-account/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                username: username,
                verification_code: code,
            }),
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.removeItem("username")
            showToast('success', data.message);
            setTimeout(() => {
                history.pushState({}, "", "/login");
                urlLocationHandler();
            }, 2000)
        } else {
            showToast('error', data?.error || "An error occurred. Please try again.");
        }
    } catch (error) {
        showToast('error', error?.error || "An error occurred. Please try again.");
    } finally {
        btn.textContent = "Verify";
        btn.disabled = false;
        codeInput.disabled = false;
    }
}
