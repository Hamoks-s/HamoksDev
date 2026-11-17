

// the hero subtext typing
const tagline = document.getElementById('tagline');

if (tagline) {
    const text = tagline.dataset.text;
    let count = 0;

    tagline.classList.add('is-typing');
    tagline.innerHTML = '<span class="tagline-typed"></span><span class="tagline-hidden"></span>';
    const typed = tagline.children[0];
    const hidden = tagline.children[1];
    hidden.textContent = text;

    function typeNext() {
        count++;
        typed.textContent = text.slice(0, count);
        hidden.textContent = text.slice(count);

        if (count < text.length) {
            setTimeout(typeNext, 48 + Math.random() * 55); // random delay so it feels human
        }
    }

    setTimeout(typeNext, 900); // wait for the title animation
}

