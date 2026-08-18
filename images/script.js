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

  function copyText(value, successMessage) {
    function done() { announce(successMessage); return true; }
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(value).then(done);
    }

    var field = document.createElement("textarea");
    field.value = value;
    field.setAttribute("readonly", "");
    field.style.position = "fixed";
    field.style.opacity = "0";
    document.body.appendChild(field);
    field.select();
    var copied = document.execCommand("copy");
    field.remove();
    if (copied) return Promise.resolve(done());
    return Promise.reject(new Error("copy failed"));
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

    function closeSearch(restoreFocus) {
      if (!search || !searchButton) return;
      var wasOpen = !search.hidden;
      search.hidden = true;
      setExpanded(searchButton, false);
      var label = searchButton.querySelector(".sr-only");
      if (label) label.textContent = "검색 열기";
      if (restoreFocus && wasOpen) searchButton.focus();
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
        if (!open) {
          closeSearch(false);
          return;
        }
        closeDropdown();
        closeMenu();
        search.hidden = false;
        setExpanded(searchButton, true);
        var label = searchButton.querySelector(".sr-only");
        if (label) label.textContent = "검색 닫기";
        if (search.animate && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
          search.animate([
            { opacity: 0, transform: "translateY(-6px)" },
            { opacity: 1, transform: "translateY(0)" }
          ], { duration: 160, easing: "ease-out" });
        }
        if (searchInput) window.setTimeout(function () { searchInput.focus(); }, 0);
      });
    }

    document.addEventListener("click", function (event) {
      if (dropdown && !event.target.closest(".nav-dropdown")) closeDropdown();
      if (search && !event.target.closest(".header-search") && !event.target.closest(".search-toggle")) closeSearch(false);
    });
    document.addEventListener("keydown", function (event) {
      if (event.key !== "Escape") return;
      closeDropdown();
      closeSearch(true);
      closeMenu();
    });
    window.matchMedia("(min-width: 821px)").addEventListener("change", function (event) {
      closeSearch(false);
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

  function setupOwnerTools() {
    var tools = document.querySelector("[data-owner-tools]");
    if (!tools) return;

    var isOwner = Boolean(window.T && window.T.config && window.T.config.ROLE === "owner");
    if (!isOwner) {
      tools.remove();
      return;
    }

    var button = tools.querySelector(".owner-fab");
    var label = button && button.querySelector(".sr-only");
    tools.hidden = false;

    function close() {
      tools.classList.remove("is-open");
      setExpanded(button, false);
      if (label) label.textContent = "관리자 메뉴 열기";
    }

    if (button) {
      button.addEventListener("click", function () {
        var open = !tools.classList.contains("is-open");
        tools.classList.toggle("is-open", open);
        setExpanded(button, open);
        if (label) label.textContent = open ? "관리자 메뉴 닫기" : "관리자 메뉴 열기";
      });
    }

    document.addEventListener("click", function (event) {
      if (!event.target.closest("[data-owner-tools]")) close();
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") close();
    });
    window.matchMedia("(min-width: 821px)").addEventListener("change", close);
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

  function setupCodeBlocks(content) {
    if (!content) return;
    content.querySelectorAll("pre").forEach(function (pre) {
      if (pre.closest(".code-frame")) return;
      var code = pre.querySelector("code");
      var value = code ? code.textContent : pre.textContent;
      var frame = document.createElement("div");
      var toolbar = document.createElement("div");
      var language = document.createElement("span");
      var copy = document.createElement("button");
      var expand = document.createElement("button");
      var classText = ((code && code.className) || "") + " " + (pre.className || "");
      var languageMatch = classText.match(/(?:language|lang)-([a-z0-9+#-]+)/i);
      var languageName = pre.dataset.language || pre.dataset.keLanguage || (languageMatch && languageMatch[1]) || "CODE";

      frame.className = "code-frame";
      toolbar.className = "code-toolbar";
      language.className = "code-language";
      language.textContent = languageName.toUpperCase();
      copy.type = "button";
      copy.className = "code-copy";
      copy.textContent = "COPY";
      copy.setAttribute("aria-label", languageName + " 코드 복사");
      expand.type = "button";
      expand.className = "code-expand";
      expand.textContent = "전체 코드 보기";
      expand.setAttribute("aria-expanded", "false");
      expand.hidden = true;

      pre.parentNode.insertBefore(frame, pre);
      toolbar.appendChild(language);
      toolbar.appendChild(copy);
      toolbar.appendChild(expand);
      frame.appendChild(toolbar);
      frame.appendChild(pre);

      copy.addEventListener("click", function () {
        copyText(value, "코드를 복사했습니다.").then(function () {
          copy.textContent = "COPIED";
          window.setTimeout(function () { copy.textContent = "COPY"; }, 1600);
        }).catch(function () {
          copy.textContent = "FAILED";
          announce("코드를 복사하지 못했습니다.");
          window.setTimeout(function () { copy.textContent = "COPY"; }, 1600);
        });
      });

      window.requestAnimationFrame(function () {
        if (pre.scrollHeight <= 520) return;
        frame.classList.add("is-collapsed");
        expand.hidden = false;
        expand.addEventListener("click", function () {
          var collapsed = frame.classList.toggle("is-collapsed");
          expand.textContent = collapsed ? "전체 코드 보기" : "코드 접기";
          expand.setAttribute("aria-expanded", String(!collapsed));
          if (collapsed) pre.scrollIntoView({ block: "nearest" });
        });
      });
    });
  }

  function setupLightbox(content) {
    var dialog = document.querySelector(".lightbox");
    if (!content || !dialog) return;
    var dialogImage = dialog.querySelector("img");
    var caption = dialog.querySelector("figcaption");
    var close = dialog.querySelector(".lightbox-close");
    var previous = dialog.querySelector(".lightbox-prev");
    var next = dialog.querySelector(".lightbox-next");
    var counter = dialog.querySelector(".lightbox-counter");
    var images = Array.from(content.querySelectorAll("img")).filter(function (image) {
      return !image.closest("a") && !image.hasAttribute("data-no-lightbox");
    });
    var opener = null;
    var currentIndex = 0;

    function getCaption(image) {
      var figure = image.closest("figure");
      var figcaption = figure && figure.querySelector("figcaption");
      if (figcaption) return figcaption.textContent.trim();
      var next = image.nextElementSibling;
      if (next && next.classList.contains("caption")) return next.textContent.trim();
      return image.alt || "";
    }

    function render(index) {
      currentIndex = index;
      var image = images[currentIndex];
      dialogImage.src = image.currentSrc || image.src;
      dialogImage.alt = image.alt || "확대 이미지";
      caption.textContent = getCaption(image);
      caption.hidden = !caption.textContent;
      counter.textContent = (currentIndex + 1) + " / " + images.length;
      counter.hidden = images.length < 2;
      previous.hidden = images.length < 2;
      next.hidden = images.length < 2;
      previous.disabled = currentIndex === 0;
      next.disabled = currentIndex === images.length - 1;
    }

    function open(image) {
      opener = image;
      render(images.indexOf(image));
      dialog.showModal();
      close.focus();
    }

    function move(delta) {
      var nextIndex = currentIndex + delta;
      if (nextIndex < 0 || nextIndex >= images.length) return;
      render(nextIndex);
    }

    images.forEach(function (image) {
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
    previous.addEventListener("click", function () { move(-1); });
    next.addEventListener("click", function () { move(1); });
    dialog.addEventListener("click", function (event) { if (event.target === dialog) closeDialog(); });
    dialog.addEventListener("keydown", function (event) {
      if (event.key === "ArrowLeft") { event.preventDefault(); move(-1); }
      if (event.key === "ArrowRight") { event.preventDefault(); move(1); }
    });
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

  function setupPageSharing() {
    var button = document.querySelector("[data-copy-page]");
    var output = document.querySelector("[data-page-url]");
    if (!button && !output) return;
    var pageUrl = new URL(window.location.href);
    pageUrl.search = "";
    pageUrl.hash = "";
    var value = pageUrl.href;
    if (output) {
      output.textContent = value;
      output.title = value;
    }
    if (!button) return;
    var label = button.querySelector("span");
    button.addEventListener("click", function () {
      copyText(value, "글 링크를 복사했습니다.").then(function () {
        if (label) label.textContent = "복사됨";
        window.setTimeout(function () { if (label) label.textContent = "링크 복사"; }, 1600);
      }).catch(function () { announce("링크를 복사하지 못했습니다."); });
    });
  }

  function setupToc(content) {
    var toc = document.getElementById("article-toc");
    var sidebar = document.querySelector(".toc-sidebar");
    var inline = document.querySelector("[data-toc-copy]");
    var mobileToggle = document.querySelector(".mobile-toc-toggle");
    var mobileClose = inline && inline.querySelector(".mobile-toc-close");
    var backdrop = document.querySelector(".toc-backdrop");
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
      var headingText = heading.textContent.trim();
      var base = heading.id || slugify(headingText);
      var count = used[base] || 0;
      used[base] = count + 1;
      heading.id = count ? base + "-" + (count + 1) : base;
      heading.dataset.tocLabel = headingText;

      var anchor = document.createElement("a");
      anchor.className = "heading-anchor";
      anchor.href = "#" + encodeURIComponent(heading.id);
      anchor.textContent = "#";
      anchor.setAttribute("aria-label", headingText + " 섹션 링크 복사");
      anchor.title = "이 섹션 링크 복사";
      anchor.addEventListener("click", function (event) {
        if (event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        var url = new URL(window.location.href);
        url.search = "";
        url.hash = heading.id;
        copyText(url.href, "섹션 링크를 복사했습니다.").then(function () {
          window.history.replaceState(null, "", url.href);
        }).catch(function () { announce("섹션 링크를 복사하지 못했습니다."); });
      });
      heading.appendChild(anchor);
    });

    var rootList = document.createElement("ol");
    var lastH2Item = null;
    headings.forEach(function (heading) {
      var item = document.createElement("li");
      var link = document.createElement("a");
      link.href = "#" + encodeURIComponent(heading.id);
      link.textContent = heading.dataset.tocLabel;
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
    if (mobileToggle) mobileToggle.hidden = false;

    function closeMobileToc() {
      if (!inline || !mobileToggle) return;
      inline.classList.remove("is-open");
      body.classList.remove("toc-open");
      mobileToggle.setAttribute("aria-expanded", "false");
      if (backdrop) backdrop.hidden = true;
    }

    if (mobileToggle && inline) {
      mobileToggle.addEventListener("click", function () {
        var open = !inline.classList.contains("is-open");
        inline.classList.toggle("is-open", open);
        body.classList.toggle("toc-open", open);
        mobileToggle.setAttribute("aria-expanded", String(open));
        if (backdrop) backdrop.hidden = !open;
        if (open && mobileClose) mobileClose.focus();
      });
      inline.querySelectorAll("a").forEach(function (link) { link.addEventListener("click", closeMobileToc); });
      if (mobileClose) mobileClose.addEventListener("click", closeMobileToc);
      if (backdrop) backdrop.addEventListener("click", closeMobileToc);
      document.addEventListener("keydown", function (event) { if (event.key === "Escape") closeMobileToc(); });
      window.matchMedia("(min-width: 821px)").addEventListener("change", closeMobileToc);
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
    setupOwnerTools();
    setupPageSharing();
    setupTables(content);
    setupCodeBlocks(content);
    setupLightbox(content);
    setupToc(content);
  });
}());
