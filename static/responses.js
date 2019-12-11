let data = JSON.parse(document.getElementById("src").getAttribute("data-src"));
const div = document.getElementById('myDiv');
for (const key in data) {
    div.innerHTML += `<h3>${key}</h3>`;
    let list = document.createElement('ol');
    for (const element in data[key]) {
        const foodChoice = data[key][element];
        let li = document.createElement('li')
        li.textContent = foodChoice.user.name + " -> Picked food at " + foodChoice.time;
        list.appendChild(li)
    }
    div.appendChild(list);
}