export default class filter {
  constructor(el) {
    this.el = el;
    this.setVars();
    this.bindEvents();
  }

  setVars() {
    this.sortSearch = this.el.querySelector("[data-filter-search]");
    this.sortTag = this.el.querySelector("[data-filter-sort-tag]");
    this.clear = this.el.querySelector("[data-filter-clear]");
    this.entries = this.el.querySelectorAll("[data-filter-entry]");
    this.sections = this.el.querySelectorAll("[data-filter-entry-section]");
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
    this.sortSearch ? this.sortSearch.value = "" : null;
    this.sortTag ? this.sortTag.value = "" : null;
    this.filterSort("", "", "");
  };

  handleSearchChange = (e) => {
    clearTimeout(this.timeout)

    this.timeout  = setTimeout(() => {
      this.handleChange()
    }, 500)
  }

  handleChange = (e) => {
    const searchValue = this.sortSearch ? this.sortSearch.value.toLowerCase() : "";
    const tagValue = this.sortTag ? this.sortTag.value : "";

    this.filterSort(searchValue, tagValue)
  };

  filterSort(filterSearch, filterTag) {
    // build array of matches
    const matches = Array.prototype.filter.call(
      this.entries,
      function (entry) {
        if (filterSearch === "" && filterTag === "") {
          return entry;
        }

        let searchMatch = true;
        let tagMatch = true;

        if (filterSearch !== "") {
          searchMatch = entry.innerHTML.toLowerCase().includes(filterSearch)
        }

        if (filterTag !== "") {
          tagMatch = entry.dataset.tags.includes(filterTag);
        }

        return searchMatch && tagMatch
      }
    );

    this.sections.forEach((section) => {
      section.animate(this.fadeOut, this.defaultTiming).finished.then(() => {
        this.entries.forEach((entry) => {
            entry.dataset.active = false;
            matches.forEach((match) => {
              match.dataset.active = true;
            });
        });
        section.animate(this.fadeIn, this.defaultTiming);
      })

    })
  }
}
