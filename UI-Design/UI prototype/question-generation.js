const fileInput = document.getElementById("file-input");
const response = document.getElementById("response");
let QandAs = [];
let Qcount = 0;
let clicks = 1;

fileInput.addEventListener("change", function (event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = function (e) {
        try {
            const jsonData = JSON.parse(e.target.result);

            for (const key in jsonData) {
                QandAs.push(jsonData[key]);
            }

            localStorage.setItem('QandAs', JSON.stringify(QandAs)); //save array to local storage to be accessed in game
            response.textContent = '';
            QandAs.forEach((q, i) => {
                addItem();
                let qNumber = i+1
                document.getElementById("qNum" + qNumber).textContent = "Question " + qNumber + ":";
                document.getElementById("Q" + qNumber).value = q.question;
                document.getElementById("aNum" + qNumber).textContent = "Answers:";
                document.getElementById("A" + qNumber).value = q.answers[0];
                document.getElementById("B" + qNumber).value = q.answers[1];
                document.getElementById("C" + qNumber).value = q.answers[2];
                document.getElementById("D" + qNumber).value = q.answers[3];
                document.getElementById("cNum" + qNumber).textContent = "Correct answer:";
                document.getElementById("Correct" + qNumber).value = q.correctAns;
            })

        } catch (error) {
            alert("Error reading JSON file: " + error);
        }
    };

    reader.readAsText(file);
});

function addItem() {
    Qcount ++;
    const template = document.getElementById("itemTemplate");
    const clone = template.content.cloneNode(true);

    clone.querySelector("#qNum").id = "qNum" + Qcount;
    clone.querySelector("#Q").id = "Q" + Qcount;
    clone.querySelector("#aNum").id = "aNum" + Qcount;
    clone.querySelector("#A").id = "A" + Qcount;
    clone.querySelector("#B").id = "B" + Qcount;
    clone.querySelector("#C").id = "C" + Qcount;
    clone.querySelector("#D").id = "D" + Qcount;
    clone.querySelector("#cNum").id = "cNum" + Qcount;
    clone.querySelector("#Correct").id = "Correct" + Qcount;

    document.getElementById("container").appendChild(clone);
}
document.getElementById("addButton").addEventListener("click", addItem);

function editItem() {
    
}
document.getElementById("editButton").addEventListener("click", editItem);