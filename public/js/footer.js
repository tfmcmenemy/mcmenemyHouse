const buttons = document.getElementsByClassName("menu-item");

Array.from(buttons).forEach((button) => {
  button.addEventListener("click", function (e) {
    clickeButton(e);
  });
});

const clickeButton = function (e) {
  let button = e.target.closest(".menu-item");
  window.location.href = button.dataset.destination;
};
