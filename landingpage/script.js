function updateText(elements, text) {
  elements.forEach(function(el) {
    el.innerText = text;
  });
}

function removeAllChildren(el) {
  while (el.firstChild) {
    el.removeChild(el.firstChild);
  }
}

function filterReleases(response) {
  return response.slice(0, 5).find(function(release) {
    return !!release.assets.length;
  });
}

function createGitreleasesLink(path) {
  const a = document.createElement("a");
  a.className = "primary no-underline underline-hover";
  a.setAttribute("rel", "noopener");
  a.setAttribute("href", path);
  a.appendChild(document.createTextNode(`gitreleases.dev${path}`));
  return a;
}

function setButtonLoading(btn) {
  btn.className += " gray";
  btn.setAttribute("disabled", true);
  btn.value = "...";
}
function resetButton(btn) {
  btn.classList.remove("gray");
  btn.removeAttribute("disabled");
  btn.value = "🔎";
}
function clearInput(e) {
  e.target.value = "";
}

function appendToListElement (el, list) {
  const li = document.createElement('li')
  li.appendChild(el)
  list.appendChild(li)
}

function createErrorNode (message) {
  const err = document.createElement('span')
  err.className = 'red'
  err.appendChild(document.createTextNode(message))
  return err
}

function onDocumentLoad() {
  const inputRepo = document.querySelector(".input-repo");
  const inputSubmit = document.querySelector(".input-submit");
  const ghReleasesSearch = document.querySelector(".gh-releases-search");
  const ghReleasesResult = document.querySelector(".gh-releases-results");
  const headingReleasesResult = document.querySelector(".heading-releases-results");

  const listener = function (event) {
    event.preventDefault();
    event.stopPropagation();

    const url = inputRepo.value;
    if (url.length === 0) {
      return
    }

    const match = /(https?:\/\/github\.com\/)?([^/]+)\/([^/]+).*/i.exec(url);
    if (!match) {
      removeAllChildren(ghReleasesResult)

      const err = createErrorNode('URL incorrect. Example: https://github.com/rokka-io/rokka-go')
      appendToListElement(err, ghReleasesResult)
      url.value = '';

      return;
    }

    const organization = match[2];
    const repo = match[3];

    setButtonLoading(inputSubmit);

    const apiURL = `https://api.github.com/repos/${organization}/${repo}/releases`;

    fetch(apiURL, {
      method: "GET",
      headers: {
        Accept: "application/vnd.github.v3+json"
      }
    })
      .then(function (response) {
        if (!response.ok) {
          return Promise.reject(response);
        }
        return response.json();
      })
      .then(function (response) {
        const release = filterReleases(response);
        return release.assets;
      })
      .then(function (assets) {
        if (!assets || !assets.length) {
          return Promise.reject(new Error("No asset found"));
        }

        removeAllChildren(ghReleasesResult);
        removeAllChildren(headingReleasesResult)
        headingReleasesResult.appendChild(document.createTextNode('Available Asset URLs'))

        assets.forEach(function (asset) {
          const path = `/gh/${organization}/${repo}/latest/${asset.name}`;
          const li = document.createElement("li");
          li.className = "pb2";
          li.appendChild(createGitreleasesLink(path));

          ghReleasesResult.appendChild(li);
        });
        resetButton(inputSubmit);
      })
      .catch(function (error) {
        resetButton(inputSubmit);
        removeAllChildren(ghReleasesResult);

        let message = error.statusText || error.message;
        if (message === "Forbidden") {
          message = `${message} - most likely means that you exceeded the hourly rate limit, sorry. Try constructing the URL on your own please :)`;
        }
        appendToListElement(createErrorNode(message), ghReleasesResult)
      });

    return false;
  }
  ghReleasesSearch.addEventListener("submit", listener);
  inputRepo.addEventListener('blur', listener);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", onDocumentLoad);
} else {
  onDocumentLoad();
}
