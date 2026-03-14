const fileInput = document.getElementById("file-input"); //Upload JSON button
const topic = document.getElementById("topic")
let QandAs = [];
let Qcount = 0;
let clicks = 1;



//Read JSON file and display it on the webpage
fileInput.addEventListener("change", function (event) {
    QandAs = [];
    if (Qcount > 0) {
        removeItems();
        Qcount = 0;
    }
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = function (e) {
        try {
            const jsonData = JSON.parse(e.target.result);

            for (const key in jsonData) { //Collect all questions
                QandAs.push(jsonData[key]);
            }

            localStorage.setItem('QandAs', JSON.stringify(QandAs)); //save array to local storage to be accessed in game
            QandAs.forEach((q, i) => { //Replicates for every question -> set text in textarea for each relevant datapoint
                console.log(i);
                addItem(); //Call to create set of empty area
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



//Creates an empty set of editable textboxes. Uses <template> from html file
function addItem() {
    Qcount ++; //index which 'set' this is
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
document.getElementById("addButton").addEventListener("click", addItem); //Call addItem()



function removeItems() {
    document.getElementById("container").innerHTML = "";
}



//Pull each set of questions and upload to JSON
function editItem() {
    const jsonData = {};

    for (let i = 1; i < Qcount+1; i++) { //Loop for as many templates are used
        let question = document.getElementById("Q" + i).value;
        let answer1 = document.getElementById("A" + i).value;
        let answer2 = document.getElementById("B" + i).value;
        let answer3 = document.getElementById("C" + i).value;
        let answer4 = document.getElementById("D" + i).value;
        let correctanswer = document.getElementById("Correct" + i).value;
        jsonData[i-1] = {
            "question": question,
            "answers": [answer1, answer2, answer3, answer4],
            "correctAns": correctanswer
        };
    }
    const jsonString = JSON.stringify(jsonData, null, 2);

    const blob = new Blob([jsonString], {type: 'application/json'});

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "new.json";

    link.click();
}
document.getElementById("editButton").addEventListener("click", editItem); //Call editItem()


