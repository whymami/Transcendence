{
    const goToProfile = (username) => {
        history.pushState({}, "", "/profile?username=" + username);
        urlLocationHandler();
    }

    const users = document.querySelectorAll('.user-card');
    users.forEach(user => {
        user.addEventListener('click', () =>{
            console.log(user.getAttribute('data-username'));
            goToProfile(user.getAttribute('data-username'))
            //console.log(user.querySelector('.username').textContent);
        });
    });
}