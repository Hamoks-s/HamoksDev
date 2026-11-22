const form = document.getElementById("grades-form")
const rowForm = document.getElementById("add-row-form")
const resetButton = document.getElementById("reset-button")

let grades = ""

function parseGrade(token) {
    const last = token.at(-1)

    if (last === "-") {
        return Number(token.slice(0, -1)) + 0.5
    }
    if (last === "+") {
        return Number(token.slice(0, -1)) - 0.5
    }
    return Number(token)

}

function updateResult (result, sumOfGrades) {
    const resultNumber = document.getElementById("result-number")
    const resultDetail = document.getElementById("result-detail")

    resultNumber.classList.remove("is-updated")
    resultNumber.offsetWidth
    resultNumber.classList.add("is-updated")
    if (sumOfGrades === 0) {
        resultNumber.textContent = "-"
        resultDetail.textContent = "Zadaj aspoň jednú známku"
        return
    } else if (result > 100000) {// so the result isnt ridiculously long
        resultNumber.textContent = "-"
        resultDetail.textContent = "Výsledok vyšiel ako moc velké číslo"
        return
    }
    
    resultNumber.textContent = result
    
    // the slovak case for znamky/znamok
    resultDetail.textContent = sumOfGrades == 1 ? "z " + sumOfGrades + " známky" : "z " + sumOfGrades + " známok"
}

function calculateGrade() {
    const gradeRows = document.getElementsByClassName("grade-row") 
    

    let sum = 0
    let n = 0
    let sumOfGrades = 0

    for (const row of gradeRows) {
        const weight = Number(row.dataset.weight)
        let listOfGrades = []
        let gradeSum = 0
        grades = row.querySelector(".grades").value.replace(/[,]/g, "").trim()

        if (grades !== "") {
            listOfGrades = grades.split(/\s+/).map(parseGrade) // split it with all the whitespaces so only a grade goes into the list, and map the - and +
        }

        for (const grade of listOfGrades){
            
            gradeSum += grade
        }
        console.log(gradeSum)

        sumOfGrades += listOfGrades.length
        sum += weight * gradeSum
        n += listOfGrades.length * weight

        console.log(listOfGrades)
    }
    console.log(sumOfGrades)
    const result = (sum/n).toFixed(2)
    updateResult(result, sumOfGrades)
    
}

function resetInputs() {
    const gradeInputs = document.getElementsByClassName("grades")

    for (const input of gradeInputs) {
        input.value = ""
    }
}

function addRow() {

    const weightInput = document.querySelector(".weight-input")
    const weight = weightInput.value
    console.log(weight)

    if (weight == 0){
        weightInput.setCustomValidity(weightInput.title)
        weightInput.reportValidity()
        weightInput.setCustomValidity("")
        return
    }

    const template = `
    <div class="grade-row" data-weight="${weight}">
        <div class="weight">${weight}</div>
        <input class="grades" type="text" placeholder="napr. 1, 2, 1, 5" aria-label="Známky s váhou ${weight}">
    </div>`

    const row = document.createElement("div")
    row.innerHTML = template
    
    try{
        document.getElementById("grade-rows").appendChild(row)
        addEventsToInput(row.querySelector(".grades"))
        weightInput.value = ""
    }
    catch (err) {
        console.log(err)
    }
    
}

function addEventsToInput(input) {
    input.addEventListener("beforeinput", (event) => {
        if (event.data === null) return // deleting, never block it
        
        // to lazy to comment all of this. the var names are explanatory enough
        const typed = event.data
        const last = input.value.at(-1)

        const typedIsDigit = /^[0-9]$/.test(typed)
        const lastIsDigit = /^[0-9]$/.test(last)
        const typedIsSign = [".", "+", "-"].includes(typed)

        const notAllowedCharacter = !/^[0-9, +.-]*$/.test(typed)
        const firstCharNotDigit = input.value.length === 0 && !typedIsDigit
        const signAfterNonDigit = !lastIsDigit && typedIsSign
        const separatorAfterDot = last === "." && [" ", ","].includes(typed)
        const noSymbolAfterDecimal = typedIsSign && input.value.at(-2) == "."

        if (notAllowedCharacter || firstCharNotDigit || signAfterNonDigit || separatorAfterDot || noSymbolAfterDecimal) {
            event.preventDefault()
        }
    })
        
    input.addEventListener("input", (event) => {
        grades = input.value.replace(/[,]/g, "")

        // again bit complicated but basically, this is the automatic ", " adding before every number, here we check that if a first number is typed, then ignore, or if ", " was typed manually by user, ignore too
        if (grades.length != 1 && input.value.slice(-3, -1) != ", " && input.value.at(-2) != "."){
            // this is where we add before the character the ", "
            input.value = /^[0-9]*$/.test(event.data) ? input.value.slice(0, -1) + ", " + input.value.at(-1) : input.value
        }
        
        
    })
}

const gradeInputs = document.getElementsByClassName("grades")

for (const input of gradeInputs) {
    addEventsToInput(input)
}

form.addEventListener("submit", (event) => {
    event.preventDefault()
    calculateGrade()
})


rowForm.addEventListener("submit", (event) => {
    event.preventDefault()
    addRow()
})

resetButton.onclick = resetInputs


Promise.all([headerReady]).then(() => headerLinksActive("tools"));