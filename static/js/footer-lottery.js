(function () {
  var links = document.querySelector(".footer-links")
  if (!links) return

  var item = document.createElement("li")
  item.className = "lottery-footer-link"
  item.innerHTML = '<a href="/lottery/" title="Marikan arvontakone" aria-label="Marikan arvontakone"><img src="/img/lottery-icon.png" alt=""></a>'
  links.appendChild(item)

  var pageHeading = document.querySelector(".page-heading")
  var pageTitle = pageHeading && pageHeading.querySelector("h1")
  if (pageTitle && pageTitle.textContent.trim() === "Marikan arvontakone" && !document.querySelector(".lottery-page-icon")) {
    var icon = document.createElement("img")
    icon.className = "lottery-page-icon"
    icon.src = "/img/lottery-icon.png"
    icon.alt = ""
    pageHeading.insertBefore(icon, pageTitle)
  }
}())
