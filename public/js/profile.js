$(document).ready(() => {
  if (selectedTab === "replies") {
    loadReplies();
  } else {
    loadPosts();
  }
});

function loadPosts() {
  $(document).ready(() => {
    $.get(
      "/api/posts",
      { postedBy: profileUserId, pinned: true },
      (results) => {
        outputPinnedPost(results, $(".pinnedPostContainer"));
      }
    );
    $.get(
      "/api/posts",
      { postedBy: profileUserId, isReply: false },
      (results) => {
        outputPosts(results, $(".postContainer"));
      }
    );
  });
}
function loadReplies() {
  $(document).ready(() => {
    $.get(
      "/api/posts",
      { postedBy: profileUserId, isReply: true },
      (results) => {
        outputPosts(results, $(".postContainer"));
      }
    );
  });
}

function outputPinnedPost(results, container) {
  if (results.length == 0) {
    container.hide();
    return;
  }
  container.html("");

  results.forEach((result) => {
    const html = createPostHtml(result);
    container.append(html);
  });
}
