document.addEventListener('DOMContentLoaded', () => {
  const button = document.getElementById('summary-button');
  if (button) {
    button.addEventListener('click', () => {
      console.log("test");
    });
  } else {
    console.error("Summary button not found");
  }
});