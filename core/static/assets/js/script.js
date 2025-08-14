const show = document.querySelector('.eye');
const un = document.querySelector('#userID');
const pw = document.querySelector('#pWord');
const login = document.querySelector('#login');
const loginMessage = document.querySelector('.login-message');

un.addEventListener('input', (e) => {
    loginMessage.classList.remove('show');
    loginMessage.classList.add('hide');
    if(un.value.trim() !== '' && pw.value.trim() !== ''){
        login.removeAttribute('disabled');
    }else{
        login.setAttribute('disabled', '');
    }
})

pw.addEventListener('input', (e) => {
    loginMessage.classList.remove('show');
    loginMessage.classList.add('hide');
    if(pw.value.trim() !== '' && un.value.trim() !== ''){
        login.removeAttribute('disabled');
    }else{
        login.setAttribute('disabled', '');
    }
})
show.addEventListener('click', (event) => {
    const style = window.getComputedStyle(show);
    const backgroundImage = style.backgroundImage;
    if (backgroundImage.slice(-10, -2) === 'show.png') {
        pw.type = 'text';
        show.style.backgroundImage = "url('../assets/img/hide.png')"
    } else {
        pw.type = 'password';
        show.style.backgroundImage = "url('../assets/img/show.png')"
    }
});