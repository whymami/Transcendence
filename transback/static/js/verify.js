{
    let verify_username = localStorage.getItem("username");
    const username_verify = new URLSearchParams(window.location.search).get("username");
    const email_verify = new URLSearchParams(window.location.search).get("email");
    if (username_verify) {
        verify_username = username_verify;
    }

    if (!verify_username) {
        showToast("error", gettext("You need to log in to access this page."));
        history.pushState({}, "", "/login");
        urlLocationHandler();
    }

    const verifyForm = document.getElementById("verifyForm");
    verifyForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        await verifyEmail();
    });

    async function verifyEmail() {
        const codeInput = document.getElementById("verificationCode");
        const btn = document.getElementsByClassName("verify-btn")[0];
        const code = codeInput.value;
        const verificationError = document.getElementById("verificationError");

        if (code.length != 6) {
            showToast("error", gettext("Invalid verify code"));
            codeInput.focus();
        }
        console.log(email_verify);
        console.log(verify_username);
        try {
            btn.textContent = gettext("Verifying...");
            btn.disabled = true;
            codeInput.disabled = true;
            const response = await fetch("/api/verify-account/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    username: verify_username,
                    verification_code: code,
                    if(email_verify) {
                        email: email_verify
                    }
                }),
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.removeItem("username")
                showToast('success', data.message);
                setTimeout(() => {
                    if (username_verify) {
                        history.pushState({}, "", "/settings");
                    } else {
                        history.pushState({}, "", "/login");
                    }
                    urlLocationHandler();
                }, 2000)
            } else {
                showToast('error', data?.error || gettext("An error occurred. Please try again."));
            }
        } catch (error) {
            showToast('error', error?.error || gettext("An error occurred. Please try again."));
        } finally {
            btn.textContent = gettext("Verify");
            btn.disabled = false;
            codeInput.disabled = false;
        }
    }

    const verify_resendLink = document.getElementById("resend-link");
    verify_resendLink.addEventListener("click", async () => {
        try {
            const response = await fetch("/api/resend-verify-code/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    username: verify_username,
                }),
            });
            const data = await response.json();
            if (response.ok) {
                showToast('success', data.message);
            } else {
                showToast('error', data?.error || gettext("An error occurred. Please try again."));
            }
        } catch (error) {
            showToast('error', error?.error || gettext("An error occurred. Please try again."));
        }
    });
}