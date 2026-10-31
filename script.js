// 1. Typing effect
const text = "Irtiqa";
let i = 0;
function type() {
  if (i < text.length) {
    document.getElementById("typed").textContent += text[i++];
    setTimeout(type, 120);
  }
}
type();

// 2. Dark mode toggle (remembers your choice)
const body = document.body;
if (localStorage.getItem("theme") === "dark") body.classList.add("dark");

document.getElementById("theme-btn").onclick = () => {
  body.classList.toggle("dark");
  localStorage.setItem("theme", body.classList.contains("dark") ? "dark" : "light");
};

// 3. Live list of your repos from the GitHub API
fetch("https://api.github.com/users/ma26b009/repos")
  .then(r => r.json())
  .then(repos => {
    const list = document.getElementById("repo-list");
    list.innerHTML = "";
    repos.forEach(r => {
      list.innerHTML += `<li><a href="${r.html_url}">${r.name}</a></li>`;
    });
  });

// 4. Footer year updates itself
document.getElementById("year").textContent = new Date().getFullYear();
