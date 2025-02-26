$(document).ready(() => {
  if (selectedTab === "followers") {
    loadFollowers();
  } else {
    loadFollowing();
  }
});

function loadFollowers() {
  $(document).ready(() => {
    $.get(`/api/users/${profileUserId}/followers`, (results) => {
      outPutUsers(results.followers, $(".resultsContainer"));
    });
  });
}
function loadFollowing() {
  $(document).ready(() => {
    $.get(`/api/users/${profileUserId}/following`, (results) => {
      outPutUsers(results.following, $(".resultsContainer"));
    });
  });
}

function outPutUsers(results, container) {
  container.html("");

  results.forEach((result) => {
    let html = createUserHtml(result, true);
    container.append(html);
  });
  if (results.length == 0) {
    container.append("<span class='noResults'>No Results</span>");
  }
}

function createUserHtml(userData, showFolllowButton) {
  let name = userData.firstName + "" + userData.lastName;

  let isFollowing =
    userLoggedIn.following && userLoggedIn.following.includes(userData._id);

  let text = isFollowing ? "Following" : "Follow";
  let buttonClass = isFollowing ? "followButton following" : "followButton";

  let followButton = "";
  if (showFolllowButton && userLoggedIn._id != userData._id) {
    followButton = `<div class='followButtonContainer'>
                          <button class="${buttonClass}" data-user='${userData._id}'>${text}</button>
                    </div>`;
  }
  return `<div class='user'>
     <div class='userImageContainer'>
     <img src='${userData.profilePic}'>
     </div>
     <div class='userDetailsContainer'>
        <div class='header'>
           <a href='/profile/${userData.username}'>${name}</a>
           <span class='username'>@${userData.username}</span>
        </div>
     </div>
     ${followButton}
  </div>`;
}
