const email = localStorage.getItem("email");

if (!email) {
    showToast("error", "You need to log in to access this page.");
    history.pushState({}, "", "/login");
    urlLocationHandler();
}

async function verifyEmail() {
    const codeInput = document.getElementById("verificationCode");
    const code = codeInput.value;
    const verificationError = document.getElementById("verificationError");

    if (code.length != 6) {
        showToast("error", "Invalid verify code");
        codeInput.focus();
    }

    try {
        const response = await fetch("/api/verify-account/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                email: email,
                verification_code: code,
            }),
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.removeItem("email")
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
    }
}
