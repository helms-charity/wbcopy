export default function decorate(block) {
  const heading = block.querySelector('[data-aue-prop="heading"]');
  if (heading) {
    heading.classList.add('highlight-heading');
  }
}