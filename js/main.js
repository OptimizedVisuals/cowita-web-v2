(function () {
  "use strict";

  const MOBILE_BREAKPOINT = 900;
  const FOOTER_ACCORDION_BREAKPOINT = 650;
  const HEADER_SCROLL_THRESHOLD = 20;


  /* =========================================================
     SHARED COMPONENT LOADER
     ========================================================= */

  async function loadComponent(selector, path) {
    const container = document.querySelector(selector);

    if (!container) {
      return false;
    }

    try {
      const response = await fetch(path);

      if (!response.ok) {
        throw new Error(
          `Failed to load ${path}: ${response.status} ${response.statusText}`
        );
      }

      container.innerHTML = await response.text();

      return true;
    } catch (error) {
      console.error(
        `CoWiTa component loading error: ${path}`,
        error
      );

      return false;
    }
  }


  /* =========================================================
     SITE INITIALIZATION
     ========================================================= */

  async function initSite() {
    /*
     * Load shared components first.
     * Navigation and footer functionality depends on
     * these elements already existing in the DOM.
     */
    await Promise.all([
      loadComponent(
        "#site-header",
        "/components/header.html"
      ),

      loadComponent(
        "#site-footer",
        "/components/footer.html"
      )
    ]);


    /*
     * Initialize all site functionality after the
     * shared components have been injected.
     */
    initMobileNavigation();
    initDropdownNavigation();
    initHeaderScrollState();
    initSmoothScrolling();
    initRevealAnimations();
    initCurrentYear();
    initFooterAccordion();
    initFooterLegacyLinks();
    initEscapeKeyHandling();
  }


  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      initSite
    );
  } else {
    initSite();
  }


  /* =========================================================
     SHARED HELPERS
     ========================================================= */

  function getSiteHeader() {
    return document.querySelector(".site-header");
  }


  function getNavigation() {
    const header = getSiteHeader();

    if (!header) {
      return null;
    }

    return {
      header: header,
      toggle: header.querySelector(".menu-toggle"),
      nav: header.querySelector(".nav-links"),
      groups: header.querySelectorAll(".nav-group")
    };
  }


  /* =========================================================
     MOBILE NAVIGATION
     ========================================================= */

  function initMobileNavigation() {
    const navigation = getNavigation();

    if (!navigation || !navigation.toggle || !navigation.nav) {
      return;
    }

    const {
      header,
      toggle,
      nav
    } = navigation;


    /*
     * Make sure the navigation has an ID so the
     * mobile menu button can reference it.
     */
    if (!nav.id) {
      nav.id = "primary-navigation";
    }

    toggle.setAttribute(
      "aria-controls",
      nav.id
    );


    function closeMenu() {
      header.classList.remove("nav-open");
      nav.classList.remove("is-open");

      toggle.setAttribute(
        "aria-expanded",
        "false"
      );

      toggle.setAttribute(
        "aria-label",
        "Open navigation"
      );
    }


    function openMenu() {
      header.classList.add("nav-open");
      nav.classList.add("is-open");

      toggle.setAttribute(
        "aria-expanded",
        "true"
      );

      toggle.setAttribute(
        "aria-label",
        "Close navigation"
      );
    }


    toggle.addEventListener("click", function () {
      const isOpen =
        toggle.getAttribute("aria-expanded") === "true";

      if (isOpen) {
        closeMenu();
      } else {
        openMenu();
      }
    });


    /*
     * Close the mobile menu after selecting a normal
     * navigation link.
     */
    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        closeMenu();
      });
    });


    /*
     * Reset mobile navigation when returning to desktop.
     */
    window.addEventListener("resize", function () {
      if (window.innerWidth > MOBILE_BREAKPOINT) {
        closeMenu();
      }
    });


    /*
     * Expose the close function for other site behaviors.
     */
    header.__cowitaCloseMenu = closeMenu;
  }


  /* =========================================================
     DROPDOWN NAVIGATION
     ========================================================= */

  function initDropdownNavigation() {
    const navigation = getNavigation();

    if (!navigation || !navigation.nav) {
      return;
    }

    const {
      header,
      nav,
      groups
    } = navigation;


    function closeAllDropdowns() {
      header
        .querySelectorAll(".nav-group[open]")
        .forEach(function (group) {
          group.removeAttribute("open");
        });
    }


    /*
     * Make dropdown closing available to other site
     * functionality, such as smooth scrolling and Escape.
     */
    window.closeCowitaDropdowns = closeAllDropdowns;


    groups.forEach(function (group) {
      const summary = group.querySelector("summary");

      if (!summary) {
        return;
      }


      summary.addEventListener("click", function () {
        /*
         * Native <details> toggles after the click event.
         * Close other groups after the current group has
         * had a chance to open.
         */
        setTimeout(function () {
          groups.forEach(function (otherGroup) {
            if (otherGroup !== group) {
              otherGroup.removeAttribute("open");
            }
          });
        }, 0);
      });


      summary.addEventListener("keydown", function (event) {
        if (event.key === "Escape") {
          group.removeAttribute("open");
          summary.focus();
        }
      });


      /*
       * Close the dropdown after selecting one of its links.
       */
      group.querySelectorAll(".dropdown a").forEach(function (link) {
        link.addEventListener("click", function () {
          group.removeAttribute("open");
        });
      });
    });


    /*
     * Close dropdowns when clicking outside the header.
     */
    document.addEventListener("click", function (event) {
      if (!header.contains(event.target)) {
        closeAllDropdowns();
      }
    });
  }


  /* =========================================================
     HEADER SCROLL STATE
     ========================================================= */

  function initHeaderScrollState() {
    const header = getSiteHeader();

    if (!header) {
      return;
    }


    function updateHeaderState() {
      if (window.scrollY > HEADER_SCROLL_THRESHOLD) {
        header.classList.add("is-scrolled");
      } else {
        header.classList.remove("is-scrolled");
      }
    }


    updateHeaderState();

    window.addEventListener(
      "scroll",
      updateHeaderState,
      { passive: true }
    );
  }


  /* =========================================================
     SMOOTH ANCHOR SCROLLING
     ========================================================= */

  function initSmoothScrolling() {
    const anchorLinks =
      document.querySelectorAll('a[href^="#"]');


    anchorLinks.forEach(function (link) {
      link.addEventListener("click", function (event) {
        /*
         * Let modified clicks behave normally.
         */
        if (
          event.ctrlKey ||
          event.metaKey ||
          event.shiftKey ||
          event.altKey
        ) {
          return;
        }


        const href = link.getAttribute("href");

        if (!href || href === "#") {
          return;
        }


        let target;

        try {
          target = document.querySelector(href);
        } catch (error) {
          return;
        }


        if (!target) {
          return;
        }


        event.preventDefault();


        /*
         * Close mobile navigation and dropdowns before scrolling.
         */
        const header = getSiteHeader();

        if (
          header &&
          typeof header.__cowitaCloseMenu === "function"
        ) {
          header.__cowitaCloseMenu();
        }


        if (
          typeof window.closeCowitaDropdowns === "function"
        ) {
          window.closeCowitaDropdowns();
        }


        /*
         * Account for the fixed/sticky site header.
         */
        const headerHeight = header
          ? header.getBoundingClientRect().height
          : 0;

        const targetPosition =
          target.getBoundingClientRect().top +
          window.scrollY -
          headerHeight;


        const prefersReducedMotion =
          window.matchMedia(
            "(prefers-reduced-motion: reduce)"
          ).matches;


        window.scrollTo({
          top: Math.max(targetPosition, 0),
          behavior: prefersReducedMotion
            ? "auto"
            : "smooth"
        });


        /*
         * Update keyboard focus for accessibility.
         */
        if (!target.hasAttribute("tabindex")) {
          target.setAttribute("tabindex", "-1");
        }


        const focusDelay =
          prefersReducedMotion ? 0 : 500;

        window.setTimeout(function () {
          target.focus({
            preventScroll: true
          });
        }, focusDelay);
      });
    });
  }


  /* =========================================================
     REVEAL ANIMATIONS
     ========================================================= */

  function initRevealAnimations() {
    const revealElements =
      document.querySelectorAll(".reveal");


    if (!revealElements.length) {
      return;
    }


    const prefersReducedMotion =
      window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;


    /*
     * Do not animate when reduced motion is requested.
     */
    if (prefersReducedMotion) {
      revealElements.forEach(function (element) {
        element.classList.add("is-visible");
      });

      return;
    }


    /*
     * Fallback for browsers without IntersectionObserver.
     */
    if (!("IntersectionObserver" in window)) {
      revealElements.forEach(function (element) {
        element.classList.add("is-visible");
      });

      return;
    }


    const observer =
      new IntersectionObserver(
        function (entries, observerInstance) {
          entries.forEach(function (entry) {
            if (!entry.isIntersecting) {
              return;
            }

            entry.target.classList.add("is-visible");

            observerInstance.unobserve(
              entry.target
            );
          });
        },
        {
          threshold: 0.12
        }
      );


    revealElements.forEach(function (element) {
      observer.observe(element);
    });
  }


  /* =========================================================
     CURRENT YEAR
     ========================================================= */

  function initCurrentYear() {
    const yearElements =
      document.querySelectorAll("[data-current-year]");


    const currentYear =
      new Date().getFullYear();


    yearElements.forEach(function (element) {
      element.textContent = currentYear;
    });
  }


  /* =========================================================
     FOOTER ACCORDION
     ========================================================= */

  function initFooterAccordion() {
    const footer =
      document.querySelector(".site-footer");


    if (!footer) {
      return;
    }


    const toggles =
      footer.querySelectorAll(
        ".footer-group-toggle"
      );


    if (!toggles.length) {
      return;
    }


    function setGroupState(toggle, isOpen) {
      const panelId =
        toggle.getAttribute("aria-controls");


      if (!panelId) {
        return;
      }


      const panel =
        footer.querySelector(
          `#${CSS.escape(panelId)}`
        );


      if (!panel) {
        return;
      }


      toggle.setAttribute(
        "aria-expanded",
        String(isOpen)
      );


      toggle.classList.toggle(
        "is-open",
        isOpen
      );


      panel.classList.toggle(
        "is-open",
        isOpen
      );


      panel.hidden = !isOpen;
    }


    function syncAccordion() {
      const isMobile =
        window.innerWidth <=
        FOOTER_ACCORDION_BREAKPOINT;


      toggles.forEach(function (toggle) {
        /*
         * Desktop: all footer groups expanded.
         * Mobile: all footer groups collapsed by default.
         */
        setGroupState(
          toggle,
          !isMobile
        );
      });
    }


    toggles.forEach(function (toggle) {
      toggle.addEventListener("click", function () {
        const isOpen =
          toggle.getAttribute("aria-expanded") === "true";


        setGroupState(
          toggle,
          !isOpen
        );
      });
    });


    syncAccordion();


    window.addEventListener(
      "resize",
      syncAccordion
    );


    /*
     * Expose footer controls for Escape-key handling.
     */
    footer.__cowitaSyncAccordion =
      syncAccordion;


    footer.__cowitaCloseAccordion =
      function () {
        toggles.forEach(function (toggle) {
          setGroupState(
            toggle,
            false
          );
        });
      };
  }


  /* =========================================================
     FOOTER LEGACY LINK NORMALIZATION
     ========================================================= */

  function initFooterLegacyLinks() {
    const footer =
      document.querySelector(".site-footer");


    if (!footer) {
      return;
    }


    /*
     * Current footer links already match the actual
     * CoWiTa file structure.
     *
     * No runtime redirects are required.
     *
     * Actual Stories paths:
     *
     * /stories/featured.html
     * /stories/participant-stories.html
     * /stories/journeys.html
     * /stories/news.html
     */
  }


  /* =========================================================
     ESCAPE KEY HANDLING
     ========================================================= */

  function initEscapeKeyHandling() {
    document.addEventListener(
      "keydown",
      function (event) {
        if (event.key !== "Escape") {
          return;
        }


        /*
         * Close header dropdowns.
         */
        if (
          typeof window.closeCowitaDropdowns ===
          "function"
        ) {
          window.closeCowitaDropdowns();
        }


        /*
         * Close mobile navigation.
         */
        const header =
          getSiteHeader();


        if (
          header &&
          typeof header.__cowitaCloseMenu ===
          "function"
        ) {
          header.__cowitaCloseMenu();
        }


        /*
         * Close footer accordion groups.
         */
        const footer =
          document.querySelector(".site-footer");


        if (
          footer &&
          typeof footer.__cowitaCloseAccordion ===
          "function"
        ) {
          footer.__cowitaCloseAccordion();
        }
      }
    );
  }

})();