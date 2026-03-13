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
                let temp = i+1
                document.getElementById("Q" + temp).value = q.question;
                document.getElementById("A" + temp).value = "A";
                document.getElementById("B" + temp).value = "B";
                document.getElementById("C" + temp).value = "C";
                document.getElementById("D" + temp).value = "D";
                document.getElementById("Correct" + temp).value = q.correctAns;
                //response.textContent += `Question ${i + 1}: ${q.question}\n`;
                //response.textContent += `Answers: ${q.answers}\n`;
                //response.textContent += `CorrectAns: ${q.correctAns}\n\n`;

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

    clone.querySelector("#Q").id = "Q" + Qcount;
    clone.querySelector("#A").id = "A" + Qcount;
    clone.querySelector("#B").id = "B" + Qcount;
    clone.querySelector("#C").id = "C" + Qcount;
    clone.querySelector("#D").id = "D" + Qcount;
    clone.querySelector("#Correct").id = "Correct" + Qcount;

    document.getElementById("container").appendChild(clone);
}
document.getElementById("addButton").addEventListener("click", addItem);

function editItem() {
    const entry = document.getElementById("Q"+clicks).value = "Hello";
    clicks++;
}
document.getElementById("editButton").addEventListener("click", editItem);