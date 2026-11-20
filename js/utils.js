function headerLinksActive(type){
    const headerLinks = document.querySelectorAll("nav a")
    headerLinks.forEach(link => { 
        link.classList = ""
        if (type == "projects" && link.textContent == "Projekty"){
            link.classList.add("is-active")
        } else if (type == "tools" && link.textContent == "Nástroje"){
            link.classList.add("is-active")
        }
    })
    
}