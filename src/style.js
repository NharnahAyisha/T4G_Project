// Toggle mobile navigation dropdown
const hamburger = document.getElementById('hamburger');
const mobileNav = document.getElementById('mobile-nav');

hamburger.addEventListener('click', () => {
  const isOpen = mobileNav.classList.toggle('open');
  hamburger.classList.toggle('open', isOpen);
  hamburger.setAttribute('aria-expanded', isOpen);
});

// Close mobile nav when a link is clicked
mobileNav.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    mobileNav.classList.remove('open');
    hamburger.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
  });
});

emailjs.init("YOUR_PUBLIC_KEY");

const form = document.getElementById("contact-form");
const successMessage = document.getElementById("success-message");

form.addEventListener("submit", function (e) {
    e.preventDefault();

    emailjs.sendForm(
        "YOUR_SERVICE_ID",
        "YOUR_TEMPLATE_ID",
        form
    ).then(function () {

        successMessage.classList.add("show");
        form.reset();

    }).catch(function (error) {

        alert("Message failed to send.");
        console.log(error);

    });
});