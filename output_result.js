document
  .getElementById("submit_btn")
  .addEventListener("click", function (event) {
    event.preventDefault();
    const responses = [];
    let gender = undefined;
    let age = undefined;
    let user_text = undefined;
    document.querySelectorAll(".question-input").forEach((input) => {
      const questionId = input.getAttribute("data-question-id");
      const aspect = input.getAttribute("data-aspect");
      const value = input.value;
      responses.push({ questionId, aspect, value });
    });

    // 收集個人資料
    const genderInput = document.querySelector('input[name="gender"]:checked');
    const ageSelect = document.querySelector('select[name="age"]');
    const usrText = document.querySelector('input[name="userInput"]');
    console.log("Gender Input:", genderInput);
    console.log("Age Select:", ageSelect);
    console.log("User Text:", usrText);

    gender = genderInput ? genderInput.value : undefined;
    age = ageSelect ? ageSelect.value : undefined;
    user_text = usrText ? usrText.value : undefined;

    // 將性別、年齡和個簽添加到每個回應中
    responses.forEach((response) => {
      response.gender = gender;
      response.age = age;
      response.user_text = user_text;
    });

    fetch("https://meme-survey-v2-1d925ee162ce.herokuapp.com/submit", {
      /**/ method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ responses }),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("Success:", data);
        alert("問卷已成功提交，謝謝！\n祝你有個美好的一天~");
        location.reload();
      })
      .catch((error) => {
        console.error("Error:", error);
        alert("提交失敗，請重試。");
      });
  });
