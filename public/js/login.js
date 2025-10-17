const joinBtn = document.getElementById("joinBtn");
const nameInput = document.getElementById("nameInput");

joinBtn.addEventListener("click", () => {
  const name = nameInput.value.trim() || "Anônimo";
  localStorage.setItem("chatName", name);
  window.location.href = "/chat";
});
