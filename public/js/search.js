$("#searchBox").keydown((e) => {
  clearTimeout(timer);
  let textbox = $(e.target);
  let value = textbox.val();
  let searchType = textbox.data().search;
  timer = setTimeout(() => {
    value = textbox.val().trim();
    if (value == "") {
      $(".resultsContainer").html("");
    } else {
      search(value, searchType);
    }
  }, 1000);
});

function search(searchTerm, searchType) {
  let url = searchType == "users" ? "/api/users" : "/api/posts";

  $.get(url, { search: searchTerm }, (results) => {
    if (searchType == "users") {
      outPutUsers(results, $(".resultsContainer"));
    } else {
      outputPosts(results, $(".resultsContainer"));
    }
  });
}
