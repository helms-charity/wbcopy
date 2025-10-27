export default function decorate(block) {
  const pictures = [...block.querySelectorAll('picture')];
  const [, , , alt] = [...block.children];
  const p = alt.querySelector('p');
  let altText = 'Default Alt';
  if (p) {
    altText = p.textContent.trim();
  }

  // Extract image URLs from <img src="">
  const links = pictures
    .map((pic) => {
      const img = pic.querySelector('img');
      return img?.src;
    })
    .filter(Boolean);

  if (!links.length) return;

  const desktop = links[0];
  const tablet = links[1] || desktop;
  const mobile = links[2] || tablet || desktop;

  const picture = document.createElement('picture');
  picture.innerHTML = `
    <source type="image/webp" srcset="${desktop}" media="(min-width: 1200px)" width="1456" height="516">
    <source type="image/webp" srcset="${tablet}" media="(min-width: 768px)" width="672" height="400">
    <source type="image/jpeg" srcset="${mobile}" media="(min-width: 320px)" width="334" height="272">
    <img loading="eager" alt="${altText}" src="${desktop}" width="1456" height="516">
  `;

  const paragraph = document.createElement('p');
  paragraph.className = 'auto-image-container-v1';
  paragraph.appendChild(picture);

  const wrapper = document.createElement('div');
  wrapper.className = 'default-content-wrapper';
  wrapper.appendChild(paragraph);

  block.innerHTML = '';
  block.appendChild(wrapper);
}
