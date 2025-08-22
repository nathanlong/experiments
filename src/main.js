import "./style.css";
import Filter from "./filter.js";

async function fetchPostData() {
  try {
    const response = await fetch("/experiments/postData.json");
    if (!response.ok) {
      throw new Error(`Failed to fetch post data: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching post data:", error);
    return {};
  }
}

function createElement(tag, attributes = {}, text = "") {
  const element = document.createElement(tag);

  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, value);
  });

  if (text) element.textContent = text;
  return element;
}

function buildPosts(posts) {
  const contentEl = document.querySelector("#content");
  const sortEl = document.querySelector("#sort");
  const allTags = new Set();
  const fragment = document.createDocumentFragment();
  let postEls = new Map();

  for (const key of Object.keys(posts)) {
    const post = posts[key];

    // build tags
    const tagList = post.tags.split(" ");
    tagList.forEach((tag) => allTags.add(tag));

    // Create elements
    const article = createElement("article", {
      class: "filter-entry",
      "data-tags": post.tags,
      "data-filter-entry": "",
      "data-active": "true",
    });

    const link = createElement(
      "a",
      { href: `/experiments${post.url}` },
      post.title,
    );
    const heading = createElement("h2", { class: "filter-entry-title" });
    heading.appendChild(link);

    if (post.new) {
      const newLabel = createElement(
        "span",
        { class: "filter-entry-new" },
        "NEW",
      );
      heading.appendChild(newLabel);
    }

    const text = createElement(
      "p",
      { class: "filter-entry-text" },
      post.description,
    );

    const date = createElement(
      "span",
      { class: "filter-entry-date" },
      post.date ? `${post.date} - ` : "* - ",
    );

    text.prepend(date);

    const tags = createElement("p", { class: "filter-entry-tags" }, post.tags);

    // Assemble article
    article.appendChild(heading);
    article.appendChild(text);
    article.appendChild(tags);

    fragment.appendChild(article);

    // Store reference
    postEls.set(key, article);
  }

  contentEl.appendChild(fragment);

  // Create tag options
  const sortedTags = [...allTags].sort((a, b) => a.localeCompare(b));
  const tagFragment = document.createDocumentFragment();

  sortedTags.forEach((tag) => {
    tagFragment.appendChild(createElement("option", { value: tag }, tag));
  });

  sortEl.appendChild(tagFragment);

  // Initialize filter
  const filterEl = document.querySelector("[data-filter]");
  new Filter(filterEl, posts, postEls);
}

async function initialize() {
  const data = await fetchPostData();
  if (Object.keys(data).length > 0) {
    buildPosts(data);
  } else {
    document.querySelector("#content").innerHTML = "<p>No posts available.</p>";
  }
}

initialize();
