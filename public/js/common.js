// Globals

let cropper;
let timer;
let selectedUsers = [];
$(document).ready(() => {
  refreshMessagesBadge();
  refreshNotificationsBadge();
});
$("#postTextarea,#replyextarea").keyup((event) => {
  const textbox = $(event.target);
  const value = textbox.val().trim();

  let isModal = textbox.parents(".modal").length == 1;
  const submitButton = isModal
    ? $("#submitReplyButton")
    : $("#submitPostButton");
  if (submitButton.length == 0) return alert("no submit button found");

  if (value == "") {
    submitButton.prop("disabled", true);
    return;
  }
  submitButton.prop("disabled", false);
  return;
});
$("#submitPostButton,#submitReplyButton").click((event) => {
  const button = $(event.target);

  let isModal = button.parents(".modal").length == 1;

  const textbox = isModal ? $("#replyextarea") : $("#postTextarea");

  const data = {
    content: textbox.val(),
  };
  if (isModal) {
    let id = button.data().id;
    if (id == null) return alert("Button id is null");
    data.replyTo = id;
  }
  $.post("/api/posts", data, (postData) => {
    if (postData.replyTo) {
      emitNotification(postData.replyTo.postedBy);
      location.reload();
    } else {
      const html = createPostHtml(postData);
      $(".postContainer").prepend(html);
      textbox.val("");
      button.prop("disabled", true);
    }
  });
});
$("#replyModal").on("show.bs.modal", (event) => {
  const button = $(event.relatedTarget);
  const postId = getPostIdFromElement(button);
  $("#submitReplyButton").data("id", postId);
  $.get("/api/posts/" + postId, (results) => {
    outputPosts(results.postData, $("#originalPostContainer"));
  });
});
$("#confirmPinModal").on("show.bs.modal", (event) => {
  const button = $(event.relatedTarget);
  const postId = getPostIdFromElement(button);
  $("#pinPostButton").data("id", postId);
});
$("#unpinModal").on("show.bs.modal", (event) => {
  const button = $(event.relatedTarget);
  const postId = getPostIdFromElement(button);
  $("#unpinPostButton").data("id", postId);
});
$("#deletePostModal").on("show.bs.modal", (event) => {
  const button = $(event.relatedTarget);
  const postId = getPostIdFromElement(button);
  $("#deletePostReplyButton").data("id", postId);
});
$("#pinPostButton").click((event) => {
  const postId = $(event.target).data("id");
  $.ajax({
    url: `/api/posts/${postId}`,
    type: "PUT",
    data: { pinned: true },
    success: (data, status, xhr) => {
      if (xhr.status != 204) {
        alert("could not pin post");

        return;
      }
      location.reload();
    },
  });
});
$("#unpinPostButton").click((event) => {
  const postId = $(event.target).data("id");
  $.ajax({
    url: `/api/posts/${postId}`,
    type: "PUT",
    data: { pinned: false },
    success: (data, status, xhr) => {
      if (xhr.status != 204) {
        alert("could not pin post");

        return;
      }
      location.reload();
    },
  });
});
$("#deletePostReplyButton").click((event) => {
  const postId = $(event.target).data("id");
  $.ajax({
    url: `/api/posts/${postId}`,
    type: "DELETE",
    success: (data, status, xhr) => {
      if (xhr.status != 202) {
        alert("could not delete post");

        return;
      }
      location.reload();
    },
  });
});
$("#replyModal").on("hidden.bs.modal", () => {
  $("#originalPostContainer").html("");
});
$("#filePhoto").change(function () {
  if (this.files && this.files[0]) {
    const reader = new FileReader();

    reader.onload = (e) => {
      const image = document.getElementById("imagePreview");
      image.src = e.target.result;
      image.style.display = "block"; // Ensure the image is visible

      // Destroy existing Cropper instance if it exists
      if (cropper) {
        cropper.destroy();
      }

      // Initialize Cropper
      cropper = new Cropper(image, {
        aspectRatio: 1 / 1, // Set aspect ratio (e.g., 1:1 for square)
        viewMode: 1, // Restrict crop box to the image size
        background: false, // Disable background
      });
    };

    reader.readAsDataURL(this.files[0]);
  }
});
$("#coverPhoto").change(function () {
  if (this.files && this.files[0]) {
    const reader = new FileReader();

    reader.onload = (e) => {
      const image = document.getElementById("coverPreview");
      image.src = e.target.result;
      image.style.display = "block"; // Ensure the image is visible

      // Destroy existing Cropper instance if it exists
      if (cropper) {
        cropper.destroy();
      }

      // Initialize Cropper
      cropper = new Cropper(image, {
        aspectRatio: 16 / 9, // Set aspect ratio (e.g., 1:1 for square)
        viewMode: 1, // Restrict crop box to the image size
        background: false, // Disable background
      });
    };

    reader.readAsDataURL(this.files[0]);
  }
});
$("#imageUploadButton").click(() => {
  let canvas = cropper.getCroppedCanvas();

  if (canvas == null) {
    alert("could not upload image , make sure its an image file");
    return;
  }
  canvas.toBlob((blob) => {
    let formData = new FormData();
    formData.append("croppedImage", blob);

    $.ajax({
      url: "/api/users/profilePicture",
      type: "POST",
      data: formData,
      processData: false,
      contentType: false,
      success: (data, status, xhr) => {
        location.reload();
      },
    });

    console.log(formData);
  });
});
$("#coverPhotoButton").click(() => {
  let canvas = cropper.getCroppedCanvas();

  if (canvas == null) {
    alert("could not upload image , make sure its an image file");
    return;
  }
  canvas.toBlob((blob) => {
    let formData = new FormData();
    formData.append("croppedImage", blob);

    $.ajax({
      url: "/api/users/coverPhoto",
      type: "POST",
      data: formData,
      processData: false,
      contentType: false,
      success: (data, status, xhr) => {
        location.reload();
      },
    });

    console.log(formData);
  });
});
$("#userSearchTextBox").keydown((e) => {
  clearTimeout(timer);
  let textbox = $(e.target);
  let value = textbox.val();
  if (value == "" && (e.which == 8 || e.keyCode == 8)) {
    // Remove user from selection
    selectedUsers.pop();
    updateSelectedUsersHtml();
    $(".resultsContainer").html("");
    if (selectedUsers.length == 0) {
      $("#createChatButton").prop("disabled", true);
    }
    return;
  }
  timer = setTimeout(() => {
    value = textbox.val().trim();
    if (value == "") {
      $(".resultsContainer").html("");
    } else {
      searchUsers(value);
    }
  }, 1000);
});
$("#createChatButton").click(() => {
  let data = JSON.stringify(selectedUsers);

  $.post("/api/chats", { users: data }, (chat) => {
    if (!chat || !chat._id) return alert("Invalid response from the server");
    window.location.href = `/messages/${chat._id}`;
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
        emitNotification(postData.postedBy);
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
        emitNotification(postData.postedBy);
      } else {
        button.removeClass("active");
      }
    },
  });
});
$(document).on("click", ".post", (event) => {
  const element = $(event.target);
  const postId = getPostIdFromElement(element);

  if (postId !== undefined && !element.is("button")) {
    window.location.href = "/posts/" + postId;
  }
});
$(document).on("click", ".followButton", (e) => {
  let button = $(e.target);
  let userId = button.data().user;
  $.ajax({
    url: `/api/users/${userId}/follow`,
    type: "PUT",
    success: (data, status, xhr) => {
      if (xhr.status == 404) {
        alert("user not found");
        return;
      }
      let difference = 1;
      if (data.following && data.following.includes(userId)) {
        button.addClass("following");
        button.text("Unfollow");
        emitNotification(userId);
      } else {
        button.removeClass("following");
        button.text("Follow");
        difference = -1;
      }
      let followersLabel = $("#followersValue");
      if (followersLabel.length != 0) {
        let followersText = followersLabel.text();
        followersText = parseInt(followersText);
        followersLabel.text(followersText + difference);
      }
    },
  });
});

$(document).on("click", ".notification.active", (e) => {
  let container = $(e.target);
  let notificationId = container.data().id;

  let href = container.attr("href");
  e.preventDefault();

  let callback = () => (window.location = href);
  markNotificationAsOpened(notificationId, callback);
});

function getPostIdFromElement(element) {
  const isRoot = element.hasClass("post");
  const rootElement = isRoot ? element : element.closest(".post");
  const postId = rootElement.data().id;

  if (postId === undefined) return alert("Post id undefined");
  return postId;
}
function createPostHtml(postData, largeFont = false) {
  if (postData == null) return alert("post object is null");

  const isRetweet = postData.retweetData !== undefined;
  const retweetedBy = isRetweet ? postData.postedBy.username : null;
  postData = isRetweet ? postData.retweetData : postData;

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
  const largeFontClass = largeFont ? "largeFont" : "";
  let retweetText = "";
  if (isRetweet) {
    retweetText = `
    <i class='fas fa-retweet'></i>
    <span>Retweeted by <a href='/profile/${retweetedBy}'>${retweetedBy}</a>
    </span>`;
  }

  let replyFlag = "";
  if (postData.replyTo && postData.replyTo._id) {
    if (!postData.replyTo._id) {
      return alert("Reply to is not populated");
    } else if (!postData.replyTo.postedBy._id) {
      return alert("PostedBy to is not populated");
    }

    let replyToUsername = postData.replyTo.postedBy.username;
    replyFlag = `<div class='replyFlag'>
                       Replying to <a href='/profile/${replyToUsername}'>@${replyToUsername}</a>
                </div>`;
  }

  let buttons = "";
  let pinnedPostText = "";
  if (postData.postedBy._id == userLoggedIn._id) {
    let dataTarget = "#confirmPinModal";
    let pinnedClass = "";
    if (postData.pinned === true) {
      dataTarget = "#unpinModal";
      pinnedClass = "active";
      pinnedPostText = `<i class="fas fa-thumbtack"></i> <span>Pinned post</span>`;
    }
    buttons = `
              <button class='pinButton ${pinnedClass}' type="button", data-bs-toggle="modal", data-bs-target="${dataTarget}" data-id="${postData._id}" ><i class="fas fa-thumbtack"></i></button>
    
              <button type="button", data-bs-toggle="modal", data-bs-target="#deletePostModal" data-id="${postData._id}" ><i class="fas fa-times"></i></button>`;
  }
  return `<div class='post ${largeFontClass}' data-id='${postData._id}'>
  <div class='postActionContainer'>
  ${retweetText}
  </div>
     <div class='mainContentContainer'>
       <div class='userImageContainer'>
         <img src='${postedBy.profilePic}'>
       </div>
       <div class="postContentContainer">
       <div class='pinnedPostText'>${pinnedPostText}</div>
          <div class="header">
            <a href='/profile/${
              postedBy.username
            }' class='displayName'>${displayName}</a>
            <span class='username'>@${postedBy.username}</span>
            <span class='date'>${timeStamp}</span>
            ${buttons}
          </div>
          ${replyFlag}
          <div class="postBody">
            <span>${postData.content}</span>
          </div>
          <div class="postFooter">
            <div class="postButtonContainer">
            <button type="button", data-bs-toggle="modal", data-bs-target="#replyModal">
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
function outputPosts(results, container) {
  container.html("");

  if (!Array.isArray(results)) {
    results = [results];
  }
  results.forEach((result) => {
    const html = createPostHtml(result);
    container.append(html);
  });
  if (results.length == 0) {
    container.append("<span class='noResults'>Nothing to show.</span>");
  }
}
function outputPostsWithReplies(results, container) {
  container.html("");

  if (results.replyTo !== undefined && results.replyTo._id !== undefined) {
    const html = createPostHtml(results.replyTo);
    container.append(html);
  }
  const mainPostHtml = createPostHtml(results.postData, true);
  container.append(mainPostHtml);
  results.replies.forEach((result) => {
    const html = createPostHtml(result);
    container.append(html);
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
function searchUsers(searchTerm) {
  $.get("/api/users", { search: searchTerm }, (results) => {
    outputSelectablehUsers(results, $(".resultsContainer"));
  });
}
function outputSelectablehUsers(results, container) {
  container.html("");

  results.forEach((result) => {
    if (
      result._id == userLoggedIn._id ||
      selectedUsers.some((u) => u._id == result._id)
    ) {
      return;
    }
    let html = createUserHtml(result, false);
    let element = $(html);
    element.click(() => {
      userSelectes(result);
    });
    container.append(element);
  });
  if (results.length == 0) {
    container.append("<span class='noResults'>No Results</span>");
  }
}
function userSelectes(user) {
  selectedUsers.push(user);
  updateSelectedUsersHtml();
  $("#userSearchTextBox").val("").focus();
  $(".resultsContainer").html("");
  $("#createChatButton").prop("disabled", false);
}
function updateSelectedUsersHtml() {
  let elements = [];
  selectedUsers.forEach((user) => {
    let name = user.firstName + "" + user.lastName;
    let userElement = $(`<span class='selectedUser'>${name}</span>`);

    elements.push(userElement);
  });
  $(".selectedUser").remove();
  $("#selectedUsers").prepend(elements);
}

function getChatName(chatData) {
  let chatName = chatData.chatName;

  if (!chatName) {
    let otherChatUsers = getOtherChatUsers(chatData.users);
    let namesArray = otherChatUsers.map(
      (user) => user.firstName + "" + user.lastName
    );

    chatName = namesArray.join(", ");
  }
  return chatName;
}

function getOtherChatUsers(users) {
  if (users.length == 1) return users;
  return users.filter((user) => {
    return user._id != userLoggedIn._id;
  });
}

function messageReceived(newMessage) {
  if ($(`[data-room="${newMessage.chat._id}]`).length == 0) {
    // Show popup notification
    showMessagePopup(newMessage);
  } else {
    addChatMessageHtml(newMessage);
  }
  refreshMessagesBadge();
}

function markNotificationAsOpened(notificationId = null, callback = null) {
  if (callback == null) callback = () => location.reload();

  let url =
    notificationId != null
      ? `/api/notifications/${notificationId}/markAsOpened`
      : `/api/notifications/markAsOpened`;

  $.ajax({
    url: url,
    type: "PUT",
    success: () => {
      callback();
    },
  });
}

function refreshMessagesBadge() {
  $.get("/api/chats", { unreadOnly: true }, (data) => {
    let numResults = data.length;
    if (numResults > 0) {
      $("#messagesBadge").text(numResults).addClass("active");
    } else {
      $("#messagesBadge").text("").removeClass("active");
    }
  });
}
function refreshNotificationsBadge() {
  $.get("/api/notifications", { unreadOnly: true }, (data) => {
    let numResults = data.length;
    if (numResults > 0) {
      $("#notificationBadge").text(numResults).addClass("active");
    } else {
      $("#notificationBadge").text("").removeClass("active");
    }
  });
}

function showNotificationPopup(data) {
  let html = createNotificationHtml(data);
  let element = $(html);
  element.hide().prependTo("#notificationList").slideDown("fast");

  setTimeout(() => element.fadeOut(400), 5000);
}
function showMessagePopup(data) {
  if (!data.chat.latestMessage._id) {
    data.chat.latestMessage = data;
  }
  let html = createChatHtml(data.chat);
  let element = $(html);
  element.hide().prependTo("#notificationList").slideDown("fast");

  setTimeout(() => element.fadeOut(400), 5000);
}

function createNotificationHtml(notification) {
  let userFrom = notification.userFrom;
  let text = getNotificationText(notification);
  let href = getNotificationUrl(notification);

  let className = notification.opened ? "" : "active";
  return `<a href=${href} class='resultListItem notification ${className}' data-id='${notification._id}'>
            <div class='resultsImageContainer'>
            <img src=${userFrom.profilePic}>
            
            </div>
            <div class='resultsDetailsContainer ellipsis'>
            <span class='ellipsis'>${text}</span>
            
            </div>
    </a>`;
}

function getNotificationText(notification) {
  let userFrom = notification.userFrom;
  if (!userFrom.firstName || !userFrom.lastName) {
    return alert("user from data not populated");
  }

  let userFromName = `${userFrom.firstName} ${userFrom.lastName}`;
  let text;

  if (notification.notificationType == "retweet") {
    text = `${userFromName} retweeted one of your posts`;
  } else if (notification.notificationType == "postLike") {
    text = `${userFromName} liked one of your posts`;
  } else if (notification.notificationType == "reply") {
    text = `${userFromName} replied one of your posts`;
  } else if (notification.notificationType == "follow") {
    text = `${userFromName} followed you`;
  }
  return `<span class='ellipsis'>${text}</span>`;
}
function getNotificationUrl(notification) {
  let url = "#";

  if (
    notification.notificationType == "retweet" ||
    notification.notificationType == "postLike" ||
    notification.notificationType == "reply"
  ) {
    url = `/posts/${notification.entityId}`;
  } else if (notification.notificationType == "follow") {
    url = `/profile/${notification.entityId}`;
  }
  return url;
}

function createChatHtml(chatData) {
  let chatName = getChatName(chatData); /// TO DO
  let image = getChatImageElements(chatData); // TO DO

  let latestMessage = getLatestMessage(chatData.latestMessage);

  let activeClass =
    !chatData.latestMessage ||
    chatData.latestMessage.readBy.includes(userLoggedIn._id)
      ? ""
      : "active";
  return `<a href='/messages/${chatData._id}' class='resultListItem ${activeClass}'>
    ${image}
    <div class='resultsDetailsContainer ellipsis'>
    <span class='heading ellipsis'>${chatName}</span>
    <span class='subText ellipsis'>${latestMessage}</span>
    
    </div>
    </a>`;
}

function getLatestMessage(latestMessage) {
  if (latestMessage != null) {
    let sender = latestMessage.sender;
    return `${sender.firstName} ${sender.lastName}: ${latestMessage.content}`;
  }
  return "New Chat";
}

function getChatImageElements(chatData) {
  let otherChatUsers = getOtherChatUsers(chatData.users);
  let groupChatClass = "";

  let chatImage = getUserChatImageElement(otherChatUsers[0]);
  if (otherChatUsers.length > 1) {
    groupChatClass = "groupChatImage";
    chatImage += getUserChatImageElement(otherChatUsers[1]);
  }
  return `<div class='resultsImageContainer ${groupChatClass}'>${chatImage}</div>`;
}
function getUserChatImageElement(user) {
  if (!user || !user.profilePic) {
    return alert("user passed into function is invalid ");
  }
  return `<img src='${user.profilePic}' alt='user's profile pic'>`;
}
