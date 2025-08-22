export default class Filter {
  constructor(el, data, els) {
    this.el = el;
    this.posts = data;
    this.postEls = els;

    // state
    this.currentSearchTerm = "";
    this.currentTag = "";
    this.timeline = null;

    // elements
    this.sortSearch = this.el.querySelector("[data-filter-search]");
    this.sortTag = this.el.querySelector("[data-filter-sort-tag]");
    this.clear = this.el.querySelector("[data-filter-clear]");
    this.entries = this.el.querySelectorAll("[data-filter-entry]");
    this.section = this.el.querySelector("[data-filter-entry-section]");
    this.timeout = null;

    // animation presets
    this.fadeOut = [
      { opacity: 1, transform: "translateY(0)" },
      { opacity: 0, transform: "translateY(5px)" },
    ];

    this.fadeIn = [
      { opacity: 0, transform: "translateY(5px)" },
      { opacity: 1, transform: "translateY(0)" },
    ];

    this.defaultTiming = {
      duration: 250,
      fill: "both",
      iterations: 1,
      easing: "cubic-bezier(0.33, 1, 0.68, 1)", //easeOutCubic
    };

    // run
    this.bindEvents();
  }

  bindEvents() {
    if (this.sortSearch) {
      this.sortSearch.addEventListener("keyup", this.handleSearchChange);
    }

    if (this.sortTag) {
      this.sortTag.addEventListener("change", this.handleChange);
    }

    this.clear.addEventListener("click", this.handleClear);
  }

  handleClear = () => {
    this.sortSearch ? (this.sortSearch.value = "") : null;
    this.sortTag ? (this.sortTag.value = "") : null;
    this.currentSearchTerm = "";
    this.currentTag = "";
    // this.filterSort("", "", "");
    this.filterPosts();
  };

  handleSearchChange = (e) => {
    clearTimeout(this.timeout);

    this.timeout = setTimeout(() => {
      this.handleChange();
    }, 500);
  };

  handleChange = (e) => {
    const searchValue = this.sortSearch
      ? this.sortSearch.value.toLowerCase()
      : "";
    const tagValue = this.sortTag ? this.sortTag.value : "";

    this.currentSearchTerm = searchValue;
    this.currentTag = tagValue;

    // this.filterSort(searchValue, tagValue);
    this.filterPosts();
  };

  filterPosts() {
    let toShow = [];
    let toHide = [];

    for (const [key, post] of Object.entries(this.posts)) {
      const element = this.postEls.get(key);
      if (!element) continue;

      const matchesSearch =
        this.currentSearchTerm === "" ||
        post.title.toLowerCase().includes(this.currentSearchTerm) ||
        post.description.toLowerCase().includes(this.currentSearchTerm);

      const matchesTag =
        this.currentTag === "" ||
        post.tags.split(" ").includes(this.currentTag);

      const shouldBeVisible = matchesSearch && matchesTag;
      const isCurrentlyVisible = element.dataset.active === "true";

      if (shouldBeVisible && !isCurrentlyVisible) {
        toShow.push(element);
      } else if (!shouldBeVisible && isCurrentlyVisible) {
        toHide.push(element);
      }
    }

    // Apply changes if needed
    if (toShow.length > 0 || toHide.length > 0) {
      this.updateVisibility(toShow, toHide);
    }
  }

  updateVisibility(toShow, toHide) {
    this.section.animate(this.fadeOut, this.defaultTiming).finished.then(() => {
      toHide.forEach((entry) => {
        entry.dataset.active = false;
      });
      toShow.forEach((entry) => {
        entry.dataset.active = true;
      });
      this.section.animate(this.fadeIn, this.defaultTiming);
    });
  }
}
