$("#postTextarea").keyup((event) => {
  const textbox = $(event.target);
  const value = textbox.val().trim();
  const submitButton = $("#submitPostButton");
  if (submitButton.length == 0) return alert("no submit button found");

  if (value == "") {
    submitButton.prop("disabled", true);
    return;
  }
  submitButton.prop("disabled", false);
  return;
});
$("#submitPostButton").click((event) => {
  const button = $(event.target);
  const textbox = $("#postTextarea");

  const data = {
    content: textbox.val(),
  };

  $.post("/api/posts", data, (postData) => {
    const html = createPostHtml(postData);
    $(".postContainer").prepend(html);
    textbox.val("");
    button.prop("disabled", true);
  });
});
$(document).on("click", ".likeButton", (event) => {
  const button = $(event.target);
  const postId = getPostIdFromElement(button);
  if (postId === undefined) return;

  $.ajax({
    url: `/api/posts/${postId}/like`,
    type: "PUT",
    success: (postData) => {
      button.find("span").text(postData.likes.length || "");
      if (postData.likes.includes(userLoggedIn._id)) {
        button.addClass("active");
      } else {
        button.removeClass("active");
      }
    },
  });
});
$(document).on("click", ".retweetButton", (event) => {
  const button = $(event.target);
  const postId = getPostIdFromElement(button);
  if (postId === undefined) return;

  $.ajax({
    url: `/api/posts/${postId}/retweet`,
    type: "POST",
    success: (postData) => {
      button.find("span").text(postData.retweetUsers.length || "");
      if (postData.retweetUsers.includes(userLoggedIn._id)) {
        button.addClass("active");
      } else {
        button.removeClass("active");
      }
    },
  });
});
function getPostIdFromElement(element) {
  const isRoot = element.hasClass("post");
  const rootElement = isRoot ? element : element.closest(".post");
  const postId = rootElement.data().id;

  if (postId === undefined) return alert("Post id undefined");
  return postId;
}
function createPostHtml(postData) {
  if (postData == null) return alert("post object is null");

  const isRetweet = postData.retweetData !== undefined;
  const retweetedBy = isRetweet ? postData.postedBy.username : null;
  postData = isRetweet ? postData.retweetData : postData;

  console.log(isRetweet);
  const postedBy = postData.postedBy;

  if (postedBy._id === undefined) {
    return console.log("user object not populated");
  }
  const displayName = postedBy.firstName + "" + postedBy.lastName;
  let timeStamp = timeDifference(new Date(), new Date(postData.createdAt));
  const likeButtonActiveClass = postData.likes.includes(userLoggedIn._id)
    ? "active"
    : "";
  const retweetButtonActiveClass = postData.retweetUsers.includes(
    userLoggedIn._id
  )
    ? "active"
    : "";
  let retweetText = "";
  if (isRetweet) {
    retweetText = `
    <i class='fas fa-retweet'></i>
    <span>Retweeted by <a href='/profile/${retweetedBy}'>${retweetedBy}</a>
    </span>`;
  }
  return `<div class='post' data-id='${postData._id}'>
  <div class='postActionContainer'>
  ${retweetText}
  </div>
     <div class='mainContentContainer'>
       <div class='userImageContainer'>
         <img src='${postedBy.profilePic}'>
       </div>
       <div class="postContentContainer">
          <div class="header">
            <a href='/profile/${
              postedBy.username
            }' class='displayName'>${displayName}</a>
            <span class='username'>@${postedBy.username}</span>
            <span class='date'>${timeStamp}</span>
          </div>
          <div class="postBody">
            <span>${postData.content}</span>
          </div>
          <div class="postFooter">
            <div class="postButtonContainer">
            <button>
                <i class='far fa-comment'></i>
            </button> 
            </div>
             <div class="postButtonContainer green">
             <button class="retweetButton ${retweetButtonActiveClass}">
                <i class='fas fa-retweet'></i>
                <span>${postData.retweetUsers.length || ""}</span>
            </button>  
            </div>
             <div class="postButtonContainer red">
            <button class="likeButton ${likeButtonActiveClass}">
                <i class='far fa-heart'></i>
                <span>${postData.likes.length || ""}</span>
            </button>  
            </div>
           
          </div>
       </div>
     </div>
  </div>`;
}

function timeDifference(current, previous) {
  const msPerMinute = 60 * 1000;
  const msPerHour = msPerMinute * 60;
  const msPerDay = msPerHour * 24;
  const msPerMonth = msPerDay * 30;
  const msPerYear = msPerDay * 365;

  let elapsed = current - previous;

  if (elapsed < msPerMinute) {
    if (elapsed / 1000 < 30) return "Just now";
    return Math.round(elapsed / 1000) + " seconds ago";
  } else if (elapsed < msPerHour) {
    return Math.round(elapsed / msPerMinute) + " minutes ago";
  } else if (elapsed < msPerDay) {
    return Math.round(elapsed / msPerHour) + " hours ago";
  } else if (elapsed < msPerMonth) {
    return Math.round(elapsed / msPerDay) + " days ago";
  } else if (elapsed < msPerYear) {
    return Math.round(elapsed / msPerMonth) + " months ago";
  } else {
    return Math.round(elapsed / msPerYear) + " years ago";
  }
}
