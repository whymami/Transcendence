const modal = document.getElementById("modal");
const modalTitle = document.getElementById("modal-title");
const modalContent = document.getElementById("modal-content");

function openModal() {
  modal.style.display = "block";
  setTimeout(() => {
    modal.classList.add("show");
  }, 10);
}

function closeModal() {
  modal.classList.remove("show");
  setTimeout(() => {
    modal.style.display = "none";
  }, 300);
}

window.onclick = function (event) {
  if (event.target == modal) {
    closeModal();
  }
};

function changeModalTitle(title) {
  modalTitle.textContent = title;
}

function changeModalContent(content) {
  modalContent.innerHTML = content;
}
