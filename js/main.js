/* =========================================================
   CoWiTa — Shared Site JavaScript
   ---------------------------------------------------------
   Canonical shared navigation system.

   Responsibilities:
   - Mobile navigation
   - Header dropdowns
   - Header scroll state
   - Smooth anchor scrolling
   - Reveal animations
   - Current year
   - Escape-key handling

   The HTML structure is intentionally kept simple.
   Native <details>/<summary> controls the dropdown state.
   ========================================================= */

(function () {
  "use strict";


  /* =========================================================
     CONFIG
     ========================================================= */

  const MOBILE_BREAKPOINT = 900;
  const HEADER_SCROLL_THRESHOLD = 20;


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

    const nav = header.querySelector(
      ".nav-links"
    );

    const menuToggle = header.querySelector(
      ".menu-toggle"
    );

    const dropdownGroups = Array.from(
      header.querySelectorAll(".nav-group")
    );

    return {
      header,
      nav,
      menuToggle,
      dropdownGroups
    };
  }


  function isModifiedClick(event) {
    return (
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    );
  }


  /* =========================================================
     MOBILE NAVIGATION
     ========================================================= */

  function initMobileNavigation() {
    const navigation = getNavigation();

    if (!navigation) {
      return;
    }

    const {
      header,
      nav,
      menuToggle
    } = navigation;


    if (!nav || !menuToggle) {
      return;
    }


    /* -------------------------------------------------------
       Ensure correct navigation relationship
       ------------------------------------------------------- */

    const navigationId =
      nav.id || "primary-navigation";

    nav.id = navigationId;

    menuToggle.setAttribute(
      "aria-controls",
      navigationId
    );


    /* -------------------------------------------------------
       Close mobile navigation
       ------------------------------------------------------- */

    function closeMenu() {
      header.classList.remove("nav-open");
      nav.classList.remove("is-open");

      menuToggle.setAttribute(
        "aria-expanded",
        "false"
      );

      menuToggle.setAttribute(
        "aria-label",
        "Open navigation"
      );
    }


    /* -------------------------------------------------------
       Open mobile navigation
       ------------------------------------------------------- */

    function openMenu() {
      header.classList.add("nav-open");
      nav.classList.add("is-open");

      menuToggle.setAttribute(
        "aria-expanded",
        "true"
      );

      menuToggle.setAttribute(
        "aria-label",
        "Close navigation"
      );
    }


    /* -------------------------------------------------------
       Toggle mobile navigation
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
       Initial state
       ------------------------------------------------------- */

    closeMenu();


    /* -------------------------------------------------------
       Menu button
       ------------------------------------------------------- */

    menuToggle.addEventListener(
      "click",
      function (event) {
        event.preventDefault();

        toggleMenu();
      }
    );


    /* -------------------------------------------------------
       Close after normal navigation link
       ------------------------------------------------------- */

    nav.querySelectorAll("a").forEach(
      function (link) {

        link.addEventListener(
          "click",
          function (event) {

            /*
             * Preserve browser behaviour for:
             * - Ctrl/Cmd click
             * - Shift click
             * - Alt click
             * - middle/new-tab behaviour
             * - downloads
             * - target="_blank"
             */
            if (
              isModifiedClick(event) ||
              link.hasAttribute("download") ||
              link.target === "_blank"
            ) {
              return;
            }

            closeMenu();
            closeAllDropdowns();
          }
        );

      }
    );


    /* -------------------------------------------------------
       Close when returning to desktop
       ------------------------------------------------------- */

    function handleResize() {
      if (
        window.innerWidth > MOBILE_BREAKPOINT
      ) {
        closeMenu();
      }
    }


    window.addEventListener(
      "resize",
      handleResize,
      { passive: true }
    );


    /*
     * Expose a small internal helper so Escape and
     * smooth scrolling can close the same navigation.
     */
    header.__cowitaCloseMenu = closeMenu;
  }


  /* =========================================================
     DROPDOWN NAVIGATION
     ========================================================= */

  function initDropdownNavigation() {
    const navigation = getNavigation();

    if (!navigation) {
      return;
    }

    const {
      header,
      dropdownGroups
    } = navigation;


    if (!dropdownGroups.length) {
      return;
    }


    /* -------------------------------------------------------
       Close every dropdown
       ------------------------------------------------------- */

    window.closeCowitaDropdowns =
      closeAllDropdowns;


    /* -------------------------------------------------------
       Setup each dropdown
       ------------------------------------------------------- */

    dropdownGroups.forEach(
      function (group) {

        const summary =
          group.querySelector(
            ":scope > summary"
          );

        if (!summary) {
          return;
        }


        /*
         * Native <summary> already provides keyboard
         * interaction. We only use the toggle event to
         * coordinate the other dropdowns.
         */
        group.addEventListener(
          "toggle",
          function () {

            if (!group.open) {
              return;
            }


            /*
             * Keep only one dropdown open at a time.
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


        /* ---------------------------------------------------
           Escape closes this dropdown
           --------------------------------------------------- */

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


        /* ---------------------------------------------------
           Dropdown links
           --------------------------------------------------- */

        group.querySelectorAll("a").forEach(
          function (link) {

            link.addEventListener(
              "click",
              function (event) {

                if (
                  isModifiedClick(event) ||
                  link.hasAttribute("download") ||
                  link.target === "_blank"
                ) {
                  return;
                }

                group.removeAttribute(
                  "open"
                );

              }
            );

          }
        );

      }
    );


    /* -------------------------------------------------------
       Click outside header
       ------------------------------------------------------- */

    document.addEventListener(
      "click",
      function (event) {

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
    document
      .querySelectorAll(
        ".site-header .nav-group[open]"
      )
      .forEach(
        function (group) {

          group.removeAttribute("open");

        }
      );
  }


  /* =========================================================
     HEADER SCROLL STATE
     ========================================================= */

  function initHeaderScrollState() {
    const header = getSiteHeader();

    if (!header) {
      return;
    }


    let ticking = false;


    function updateHeader() {

      if (
        window.scrollY >
        HEADER_SCROLL_THRESHOLD
      ) {
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
     SMOOTH ANCHOR SCROLLING
     ========================================================= */

  function initSmoothScrolling() {

    const links =
      document.querySelectorAll(
        'a[href^="#"]'
      );


    if (!links.length) {
      return;
    }


    links.forEach(
      function (link) {

        link.addEventListener(
          "click",
          function (event) {

            /*
             * Preserve modified clicks.
             */
            if (
              isModifiedClick(event)
            ) {
              return;
            }


            const href =
              link.getAttribute("href");


            /*
             * Ignore empty anchors.
             */
            if (
              !href ||
              href === "#"
            ) {
              return;
            }


            let target = null;


            /*
             * Prevent malformed selectors from
             * breaking the rest of the JS.
             */
            try {
              target =
                document.querySelector(
                  href
                );
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
              target.getBoundingClientRect()
                .top +
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
             * Allow keyboard users to focus the
             * destination without moving the page.
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

      }
    );
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


    const nav =
      header.querySelector(
        ".nav-links"
      );


    if (nav) {
      nav.classList.remove(
        "is-open"
      );
    }


    const menuToggle =
      header.querySelector(
        ".menu-toggle"
      );


    if (menuToggle) {

      menuToggle.setAttribute(
        "aria-expanded",
        "false"
      );

      menuToggle.setAttribute(
        "aria-label",
        "Open navigation"
      );

    }
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


    /* -------------------------------------------------------
       Reduced motion
       ------------------------------------------------------- */

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


    /* -------------------------------------------------------
       IntersectionObserver
       ------------------------------------------------------- */

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
           * Important:
           * Content starts visible by default in CSS.
           * JavaScript explicitly enables the hidden
           * state before observing it.
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


    /* -------------------------------------------------------
       Fallback
       ------------------------------------------------------- */

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

        if (
          event.key !== "Escape"
        ) {
          return;
        }


        /*
         * Close dropdowns first.
         */
        closeAllDropdowns();


        /*
         * Then close the mobile navigation.
         */
        closeMobileNavigation();

      }
    );
  }

})();