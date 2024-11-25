{
    const username = localStorage.getItem("username");

    if (!username) {
        showToast("error", gettext("You need to log in to access this page."));
        history.pushState({}, "", "/login");
        urlLocationHandler();
    }
}

async function verify2FA() {
    const codeInput = document.getElementById("twoFaCode");
    const code = codeInput.value;
    const username = localStorage.getItem("username");
    const verifyButton = document.getElementsByClassName("verify-btn")[0];
    const verificationError = document.getElementById("twoFaError");

    if (code.length != 6) {
        showToast("error", gettext("Invalid verify code"));
        codeInput.focus();
    }

    try {
        codeInput.disabled = true;
        verifyButton.disabled = true;
        verifyButton.textContent = gettext("Verifying...");
        const response = await fetch("/api/verify-login/", {
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

            setCookie('access_token', data.access, 1);
            setCookie('refresh_token', data.refresh, 2);

            showToast('success', data.message);

            setTimeout(() => {
                document.body.removeChild(document.getElementsByTagName('header')[0]);
                pullHeader();
                history.pushState({}, "", "/");
                urlLocationHandler();
            }, 2000)
        } else {
            showToast('error', data.error || gettext("An error occurred. Please try again."));
        }
    } catch (error) {
        console.error('Error:', error?.message);
        showToast('error', error?.error || gettext("An error occurred. Please try again."));
    } finally {
        codeInput.disabled = false;
        verifyButton.disabled = false;
        verifyButton.textContent = gettext("Verify");
    }
}
