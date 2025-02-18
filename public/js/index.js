function setActive(selected) {
  document.querySelectorAll(".menu-item").forEach((item) => {
    item.classList.remove("active");
  });
  selected.classList.add("active");
}
