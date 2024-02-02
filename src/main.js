import "./style.css";
import filter from "./filter.js"

async function populate() {
  const requestURL = "/experiments/postData.json";
  const request = new Request(requestURL);

  const response = await fetch(request);
  const data = await response.json();

  buildPosts(data);
}

function buildPosts(data) {
  const section = document.querySelector("#app");
  const sort = document.querySelector("#sort");
  const posts = data;
  const tags = [];

  for (const data of Object.keys(posts)) {
    const post = posts[data];
    const myArticle = document.createElement("article");
    const myH2 = document.createElement("h2");
    const myLink = document.createElement("a");
    const myText = document.createElement("p");
    const myDate = document.createElement("span");
    const myTags = document.createElement("p");
    const tag = post.tags.split(" ");
    tag.forEach((tag) => {
      tags.push(tag);
    });

    myLink.textContent = post.title;
    myText.textContent = post.description;
    myDate.textContent = post.date ? post.date + " - " : "* - ";
    myTags.textContent = post.tags;
    myText.prepend(myDate);
    myLink.setAttribute('href', '/experiments' + post.url);
    myTags.setAttribute('class', 'filter-entry-tags')
    myH2.appendChild(myLink)
    myH2.setAttribute('data-text', post.title)
    myArticle.appendChild(myH2);
    myArticle.appendChild(myText);
    myArticle.appendChild(myTags);
    section.appendChild(myArticle);
    myArticle.setAttribute("class", "filter-entry");
    myArticle.setAttribute("data-tags", post.tags);
    myArticle.setAttribute("data-filter-entry", "");
    myArticle.setAttribute("data-active", "true");
  }

  const uniqueTags = tags.filter(onlyUnique);
  uniqueTags.sort((a, b) => a.localeCompare(b));

  for (const tag of uniqueTags) {
    const myOption = document.createElement("option");
    myOption.textContent = tag;
    myOption.value = tag;
    sort.appendChild(myOption);
  }

  const filterEl = document.querySelector('[data-filter]')
  new filter(filterEl)
}

function onlyUnique(value, index, array) {
  return array.indexOf(value) === index;
}

populate();

