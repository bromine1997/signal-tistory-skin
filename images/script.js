"use strict";

(function () {
  var root = document.documentElement;
  var body = document.body;
  var status = document.getElementById("signal-status");

  function announce(message) {
    if (!status) return;
    status.textContent = "";
    window.setTimeout(function () { status.textContent = message; }, 30);
  }

  function setExpanded(button, expanded) {
    if (button) button.setAttribute("aria-expanded", String(expanded));
  }

  function setupTheme() {
    var button = document.querySelector(".theme-toggle");
    var themeMeta = document.querySelector('meta[name="theme-color"]');
    if (!button) return;

    function sync() {
      var dark = root.dataset.theme === "dark";
      button.setAttribute("aria-label", dark ? "라이트 모드로 전환" : "다크 모드로 전환");
      if (themeMeta) themeMeta.setAttribute("content", dark ? "#0f1117" : "#f3f4f6");
    }

    button.addEventListener("click", function () {
      var next = root.dataset.theme === "dark" ? "light" : "dark";
      root.dataset.theme = next;
      localStorage.setItem("signal-theme", next);
      sync();
      announce(next === "dark" ? "다크 모드가 적용되었습니다." : "라이트 모드가 적용되었습니다.");
    });
    sync();
  }

  function setupNavigation() {
    var navButton = document.querySelector(".nav-toggle");
    var menu = document.getElementById("primary-menu");
    var dropdownButton = document.querySelector(".nav-dropdown-toggle");
    var dropdown = document.querySelector(".nav-dropdown-panel");
    var searchButton = document.querySelector(".search-toggle");
    var search = document.getElementById("header-search");
    var searchInput = document.getElementById("signal-search");

    function closeMenu() {
      if (!menu || !navButton) return;
      menu.classList.remove("is-open");
      body.classList.remove("nav-open");
      setExpanded(navButton, false);
      var label = navButton.querySelector(".sr-only");
      if (label) label.textContent = "메뉴 열기";
    }

    function closeDropdown() {
      if (!dropdown || !dropdownButton) return;
      dropdown.hidden = true;
      setExpanded(dropdownButton, false);
    }

    function closeSearch() {
      if (!search || !searchButton) return;
      search.hidden = true;
      setExpanded(searchButton, false);
    }

    if (navButton && menu) {
      navButton.addEventListener("click", function () {
        var open = !menu.classList.contains("is-open");
        menu.classList.toggle("is-open", open);
        body.classList.toggle("nav-open", open);
        setExpanded(navButton, open);
        var label = navButton.querySelector(".sr-only");
        if (label) label.textContent = open ? "메뉴 닫기" : "메뉴 열기";
      });
      menu.querySelectorAll("a").forEach(function (link) { link.addEventListener("click", closeMenu); });
    }

    if (dropdownButton && dropdown) {
      dropdown.hidden = true;
      dropdownButton.addEventListener("click", function () {
        var open = dropdown.hidden;
        dropdown.hidden = !open;
        setExpanded(dropdownButton, open);
      });
    }

    if (searchButton && search) {
      searchButton.addEventListener("click", function () {
        var open = search.hidden;
        search.hidden = !open;
        setExpanded(searchButton, open);
        if (open && searchInput) window.setTimeout(function () { searchInput.focus(); }, 0);
      });
    }

    document.addEventListener("click", function (event) {
      if (dropdown && !event.target.closest(".nav-dropdown")) closeDropdown();
      if (search && !event.target.closest(".site-header")) closeSearch();
    });
    document.addEventListener("keydown", function (event) {
      if (event.key !== "Escape") return;
      closeDropdown();
      closeSearch();
      closeMenu();
    });
    window.matchMedia("(min-width: 821px)").addEventListener("change", function (event) {
      if (event.matches) closeMenu();
    });
  }

  function setupVisitorCounts() {
    document.querySelectorAll("[data-count]").forEach(function (element) {
      var digits = element.textContent.replace(/[^0-9]/g, "");
      if (!digits) return;
      element.textContent = Number(digits).toLocaleString("ko-KR");
      element.title = element.textContent + "명";
    });
  }

  function setupTables(content) {
    if (!content) return;
    content.querySelectorAll("table").forEach(function (table) {
      if (table.parentElement && table.parentElement.classList.contains("table-scroll")) return;
      var wrapper = document.createElement("div");
      wrapper.className = "table-scroll";
      wrapper.tabIndex = 0;
      wrapper.setAttribute("role", "region");
      wrapper.setAttribute("aria-label", "가로로 스크롤할 수 있는 표");
      table.parentNode.insertBefore(wrapper, table);
      wrapper.appendChild(table);
    });
  }

  function setupCodeCopy(content) {
    if (!content) return;
    content.querySelectorAll("pre").forEach(function (pre) {
      if (pre.querySelector(".code-copy")) return;
      var code = pre.querySelector("code");
      var button = document.createElement("button");
      button.type = "button";
      button.className = "code-copy";
      button.textContent = "COPY";
      button.setAttribute("aria-label", "코드 복사");
      button.addEventListener("click", function () {
        var value = code ? code.textContent : pre.textContent;
        navigator.clipboard.writeText(value).then(function () {
          button.textContent = "COPIED";
          announce("코드를 복사했습니다.");
          window.setTimeout(function () { button.textContent = "COPY"; }, 1600);
        }).catch(function () {
          button.textContent = "FAILED";
          announce("코드를 복사하지 못했습니다.");
          window.setTimeout(function () { button.textContent = "COPY"; }, 1600);
        });
      });
      pre.appendChild(button);
    });
  }

  function setupLightbox(content) {
    var dialog = document.querySelector(".lightbox");
    if (!content || !dialog) return;
    var dialogImage = dialog.querySelector("img");
    var caption = dialog.querySelector("figcaption");
    var close = dialog.querySelector(".lightbox-close");
    var opener = null;

    function getCaption(image) {
      var figure = image.closest("figure");
      var figcaption = figure && figure.querySelector("figcaption");
      if (figcaption) return figcaption.textContent.trim();
      var next = image.nextElementSibling;
      if (next && next.classList.contains("caption")) return next.textContent.trim();
      return image.alt || "";
    }

    function open(image) {
      opener = image;
      dialogImage.src = image.currentSrc || image.src;
      dialogImage.alt = image.alt || "확대 이미지";
      caption.textContent = getCaption(image);
      caption.hidden = !caption.textContent;
      dialog.showModal();
      close.focus();
    }

    content.querySelectorAll("img").forEach(function (image) {
      if (image.closest("a") || image.hasAttribute("data-no-lightbox")) return;
      image.tabIndex = 0;
      image.setAttribute("role", "button");
      image.setAttribute("aria-label", (image.alt ? image.alt + " — " : "") + "이미지 확대 보기");
      image.addEventListener("click", function () { open(image); });
      image.addEventListener("keydown", function (event) {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          open(image);
        }
      });
    });

    function closeDialog() { if (dialog.open) dialog.close(); }
    close.addEventListener("click", closeDialog);
    dialog.addEventListener("click", function (event) { if (event.target === dialog) closeDialog(); });
    dialog.addEventListener("close", function () {
      dialogImage.src = "";
      if (opener) opener.focus();
    });
  }

  function slugify(text) {
    return text.trim().toLowerCase()
      .replace(/[^\p{L}\p{N}\s-]/gu, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-") || "section";
  }

  function setupToc(content) {
    var toc = document.getElementById("article-toc");
    var sidebar = document.querySelector(".toc-sidebar");
    var inline = document.querySelector("[data-toc-copy]");
    if (!content || !toc || !sidebar) {
      if (sidebar) sidebar.classList.add("is-empty");
      return;
    }
    var headings = Array.from(content.querySelectorAll("h2, h3"));
    if (headings.length < 2) {
      sidebar.classList.add("is-empty");
      return;
    }

    var used = Object.create(null);
    headings.forEach(function (heading) {
      var base = heading.id || slugify(heading.textContent);
      var count = used[base] || 0;
      used[base] = count + 1;
      heading.id = count ? base + "-" + (count + 1) : base;
    });

    var rootList = document.createElement("ol");
    var lastH2Item = null;
    headings.forEach(function (heading) {
      var item = document.createElement("li");
      var link = document.createElement("a");
      link.href = "#" + encodeURIComponent(heading.id);
      link.textContent = heading.textContent;
      link.dataset.target = heading.id;
      item.appendChild(link);
      if (heading.tagName === "H3" && lastH2Item) {
        var nested = lastH2Item.querySelector("ol");
        if (!nested) { nested = document.createElement("ol"); lastH2Item.appendChild(nested); }
        nested.appendChild(item);
      } else {
        rootList.appendChild(item);
        if (heading.tagName === "H2") lastH2Item = item;
      }
    });
    toc.appendChild(rootList);

    if (inline) {
      inline.appendChild(rootList.cloneNode(true));
      inline.hidden = false;
    }

    var links = Array.from(toc.querySelectorAll("a"));
    function activate(id) {
      links.forEach(function (link) {
        var active = link.dataset.target === id;
        link.classList.toggle("is-active", active);
        if (active) link.setAttribute("aria-current", "location");
        else link.removeAttribute("aria-current");
      });
    }

    if ("IntersectionObserver" in window) {
      var observer = new IntersectionObserver(function (entries) {
        var visible = entries.filter(function (entry) { return entry.isIntersecting; });
        visible.sort(function (a, b) { return a.boundingClientRect.top - b.boundingClientRect.top; });
        if (visible[0]) activate(visible[0].target.id);
      }, { rootMargin: "-80px 0px -65% 0px", threshold: 0 });
      headings.forEach(function (heading) { observer.observe(heading); });
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    var content = document.querySelector(".article-content");
    setupTheme();
    setupNavigation();
    setupVisitorCounts();
    setupTables(content);
    setupCodeCopy(content);
    setupLightbox(content);
    setupToc(content);
  });
}());
