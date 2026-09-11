/* =========================================================
   CoWiTa — Shared Site JavaScript
   V2 — Revised Shared Navigation System
   ========================================================= */

(function () {
  "use strict";


  /* =========================================================
     CONFIG
     ========================================================= */

  const MOBILE_BREAKPOINT = 900;


  /* =========================================================
     DOM READY
     ========================================================= */

  function initSite() {
    initMobileNavigation();
    initDropdownNavigation();
    initHeaderScrollState();
    initSmoothScrolling();
    initRevealAnimations();
    initCurrentYear();
    initEscapeKeyHandling();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initSite);
  } else {
    initSite();
  }


  /* =========================================================
     SHARED NAVIGATION HELPERS
     ========================================================= */

  function getSiteHeader() {
    return document.querySelector(".site-header");
  }


  function getNavigationContainers() {
    return Array.from(
      document.querySelectorAll(
        ".nav-links, .primary-nav"
      )
    );
  }


  function getNavigationToggle() {
    return document.querySelector(".menu-toggle");
  }


  function getDropdownGroups() {
    return Array.from(
      document.querySelectorAll(
        ".nav-group, .nav-dropdown"
      )
    );
  }


  function getHeaderNavigation() {
    const header = getSiteHeader();

    if (!header) {
      return null;
    }

    return {
      header: header,

      toggles: Array.from(
        header.querySelectorAll(".menu-toggle")
      ),

      containers: Array.from(
        header.querySelectorAll(
          ".nav-links, .primary-nav"
        )
      ),

      dropdowns: Array.from(
        header.querySelectorAll(
          ".nav-group, .nav-dropdown"
        )
      )
    };
  }


  /* =========================================================
     MOBILE NAVIGATION
     ========================================================= */

  function initMobileNavigation() {
    const navigation = getHeaderNavigation();

    if (!navigation) {
      return;
    }

    const {
      header,
      toggles,
      containers
    } = navigation;

    if (!toggles.length || !containers.length) {
      return;
    }


    /* -------------------------------------------------------
       Set initial ARIA state
       ------------------------------------------------------- */

    toggles.forEach(function (toggle) {
      toggle.setAttribute("aria-expanded", "false");

      /*
       * Connect the button to the navigation where possible.
       * If multiple navigation containers exist, the first
       * visible/primary one is used.
       */
      const navigationId =
        containers[0].id ||
        "cowita-primary-navigation";

      if (!containers[0].id) {
        containers[0].id = navigationId;
      }

      toggle.setAttribute(
        "aria-controls",
        navigationId
      );
    });


    /* -------------------------------------------------------
       Close mobile navigation
       ------------------------------------------------------- */

    function closeMenu() {
      header.classList.remove("nav-open");

      containers.forEach(function (container) {
        container.classList.remove("is-open");
      });

      toggles.forEach(function (toggle) {
        toggle.setAttribute(
          "aria-expanded",
          "false"
        );
      });
    }


    /* -------------------------------------------------------
       Open mobile navigation
       ------------------------------------------------------- */

    function openMenu() {
      header.classList.add("nav-open");

      containers.forEach(function (container) {
        container.classList.add("is-open");
      });

      toggles.forEach(function (toggle) {
        toggle.setAttribute(
          "aria-expanded",
          "true"
        );
      });
    }


    /* -------------------------------------------------------
       Toggle navigation
       ------------------------------------------------------- */

    function toggleMenu() {
      const isOpen =
        header.classList.contains("nav-open");

      if (isOpen) {
        closeMenu();
      } else {
        openMenu();
      }
    }


    /* -------------------------------------------------------
       Toggle button events
       ------------------------------------------------------- */

    toggles.forEach(function (toggle) {
      toggle.addEventListener("click", function (event) {
        event.preventDefault();

        toggleMenu();
      });
    });


    /* -------------------------------------------------------
       Close menu after selecting a normal link
       ------------------------------------------------------- */

    containers.forEach(function (container) {

      container
        .querySelectorAll("a")
        .forEach(function (link) {

          link.addEventListener(
            "click",
            function () {

              /*
               * Do not interfere with:
               * - modifier-clicks
               * - new-tab behaviour
               * - downloads
               * - external links
               */
              if (
                eventHasModifier(arguments[0]) ||
                link.hasAttribute("download") ||
                link.target === "_blank"
              ) {
                return;
              }

              closeMenu();

              closeAllDropdowns();
            }
          );

        });

    });


    /* -------------------------------------------------------
       Reset mobile state when returning to desktop
       ------------------------------------------------------- */

    function handleResize() {
      if (window.innerWidth > MOBILE_BREAKPOINT) {
        closeMenu();
      }
    }

    window.addEventListener(
      "resize",
      handleResize,
      { passive: true }
    );

  }


  /* =========================================================
     DROPDOWN NAVIGATION
     ========================================================= */

  function initDropdownNavigation() {
    const dropdownGroups =
      getDropdownGroups();

    if (!dropdownGroups.length) {
      return;
    }


    /* -------------------------------------------------------
       Close all dropdowns
       ------------------------------------------------------- */

    window.closeCowitaDropdowns =
      closeAllDropdowns;


    /* -------------------------------------------------------
       Setup each dropdown
       ------------------------------------------------------- */

    dropdownGroups.forEach(function (group) {

      const summary =
        group.querySelector(":scope > summary");

      if (!summary) {
        return;
      }


      /* -----------------------------------------------------
         Ensure summary is keyboard accessible
         ----------------------------------------------------- */

      if (!summary.hasAttribute("tabindex")) {
        summary.setAttribute("tabindex", "0");
      }


      /* -----------------------------------------------------
         Native <details> toggle event
         ----------------------------------------------------- */

      group.addEventListener(
        "toggle",
        function () {

          if (!group.open) {
            return;
          }

          /*
           * Only one dropdown should remain open at a time.
           */
          dropdownGroups.forEach(
            function (otherGroup) {

              if (
                otherGroup !== group &&
                otherGroup.open
              ) {
                otherGroup.removeAttribute(
                  "open"
                );
              }

            }
          );

        }
      );


      /* -----------------------------------------------------
         Escape closes the current dropdown
         ----------------------------------------------------- */

      summary.addEventListener(
        "keydown",
        function (event) {

          if (event.key !== "Escape") {
            return;
          }

          event.preventDefault();
          event.stopPropagation();

          group.removeAttribute("open");

          summary.focus();

        }
      );

    });


    /* -------------------------------------------------------
       Click outside navigation closes dropdowns
       ------------------------------------------------------- */

    document.addEventListener(
      "click",
      function (event) {

        const header =
          getSiteHeader();

        if (!header) {
          return;
        }

        if (
          header.contains(event.target)
        ) {
          return;
        }

        closeAllDropdowns();

      }
    );

  }


  /* =========================================================
     CLOSE ALL DROPDOWNS
     ========================================================= */

  function closeAllDropdowns() {
    getDropdownGroups().forEach(
      function (group) {

        if (group.open) {
          group.removeAttribute("open");
        }

      }
    );
  }


  /* =========================================================
     HEADER SCROLL STATE
     ========================================================= */

  function initHeaderScrollState() {
    const header =
      getSiteHeader();

    if (!header) {
      return;
    }

    let ticking = false;


    function updateHeader() {

      if (window.scrollY > 20) {
        header.classList.add(
          "is-scrolled"
        );
      } else {
        header.classList.remove(
          "is-scrolled"
        );
      }

      ticking = false;
    }


    function requestHeaderUpdate() {

      if (ticking) {
        return;
      }

      window.requestAnimationFrame(
        updateHeader
      );

      ticking = true;
    }


    updateHeader();


    window.addEventListener(
      "scroll",
      requestHeaderUpdate,
      {
        passive: true
      }
    );

  }


  /* =========================================================
     SMOOTH SCROLLING
     ========================================================= */

  function initSmoothScrolling() {

    const links =
      document.querySelectorAll(
        'a[href^="#"]'
      );

    if (!links.length) {
      return;
    }


    links.forEach(function (link) {

      link.addEventListener(
        "click",
        function (event) {

          const href =
            link.getAttribute("href");

          /*
           * Ignore empty/hash-only links.
           */
          if (
            !href ||
            href === "#"
          ) {
            return;
          }


          /*
           * Ignore invalid CSS selectors instead
           * of allowing querySelector() to throw.
           */
          let target = null;

          try {
            target =
              document.querySelector(href);
          } catch (error) {
            return;
          }


          if (!target) {
            return;
          }


          event.preventDefault();


          /*
           * Close navigation before scrolling.
           */
          closeMobileNavigation();
          closeAllDropdowns();


          const header =
            getSiteHeader();

          const headerHeight =
            header
              ? header.offsetHeight
              : 0;


          const targetPosition =
            target.getBoundingClientRect().top +
            window.scrollY -
            headerHeight -
            20;


          window.scrollTo({
            top: Math.max(
              targetPosition,
              0
            ),
            behavior:
              getScrollBehavior()
          });


          /*
           * Give keyboard users a meaningful
           * focus target.
           */
          if (
            !target.hasAttribute(
              "tabindex"
            )
          ) {
            target.setAttribute(
              "tabindex",
              "-1"
            );
          }


          window.setTimeout(
            function () {

              target.focus({
                preventScroll: true
              });

            },
            100
          );

        }
      );

    });

  }


  /* =========================================================
     CLOSE MOBILE NAVIGATION
     ========================================================= */

  function closeMobileNavigation() {

    const header =
      getSiteHeader();

    if (!header) {
      return;
    }


    header.classList.remove(
      "nav-open"
    );


    const containers =
      header.querySelectorAll(
        ".nav-links, .primary-nav"
      );


    containers.forEach(
      function (container) {

        container.classList.remove(
          "is-open"
        );

      }
    );


    const toggles =
      header.querySelectorAll(
        ".menu-toggle"
      );


    toggles.forEach(
      function (toggle) {

        toggle.setAttribute(
          "aria-expanded",
          "false"
        );

      }
    );

  }


  /* =========================================================
     SCROLL BEHAVIOUR
     ========================================================= */

  function getScrollBehavior() {

    const reducedMotion =
      window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;

    return reducedMotion
      ? "auto"
      : "smooth";
  }


  /* =========================================================
     REVEAL ANIMATIONS
     ========================================================= */

  function initRevealAnimations() {

    const revealElements =
      document.querySelectorAll(
        ".reveal"
      );

    if (!revealElements.length) {
      return;
    }


    const reducedMotion =
      window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;


    /*
     * Respect reduced-motion preferences.
     */
    if (reducedMotion) {

      revealElements.forEach(
        function (element) {

          element.classList.add(
            "is-visible"
          );

          element.classList.remove(
            "is-hidden"
          );

        }
      );

      return;
    }


    /*
     * IntersectionObserver.
     */
    if (
      "IntersectionObserver" in window
    ) {

      const observer =
        new IntersectionObserver(
          function (
            entries,
            observerInstance
          ) {

            entries.forEach(
              function (entry) {

                if (
                  !entry.isIntersecting
                ) {
                  return;
                }


                entry.target.classList.add(
                  "is-visible"
                );

                entry.target.classList.remove(
                  "is-hidden"
                );


                observerInstance.unobserve(
                  entry.target
                );

              }
            );

          },
          {
            threshold: 0.12,

            rootMargin:
              "0px 0px -40px 0px"
          }
        );


      revealElements.forEach(
        function (element) {

          /*
           * Explicitly activate the hidden
           * animation state only when JS exists.
           */
          element.classList.add(
            "is-hidden"
          );

          observer.observe(
            element
          );

        }
      );

      return;
    }


    /*
     * Fallback.
     */
    revealElements.forEach(
      function (element) {

        element.classList.add(
          "is-visible"
        );

        element.classList.remove(
          "is-hidden"
        );

      }
    );

  }


  /* =========================================================
     CURRENT YEAR
     ========================================================= */

  function initCurrentYear() {

    const yearElements =
      document.querySelectorAll(
        "[data-current-year]"
      );

    if (!yearElements.length) {
      return;
    }


    const currentYear =
      new Date().getFullYear();


    yearElements.forEach(
      function (element) {

        element.textContent =
          currentYear;

      }
    );

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
         * Close all navigation dropdowns.
         */
        closeAllDropdowns();


        /*
         * Close mobile navigation.
         */
        closeMobileNavigation();

      }
    );

  }


  /* =========================================================
     LINK EVENT HELPER
     ========================================================= */

  function eventHasModifier(event) {

    if (!event) {
      return false;
    }

    return (
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    );

  }


})();