const url = "https://www.youtube.com/list_ajax?style=json&action_get_list=1&list=PLLctZz1FdqVrSgM62-NVqxpBf9t__UvXG";
fetch(url)
  .then(r => r.json())
  .then(d => {
      d.video.slice(0, 5).forEach((v, i) => {
         console.log(`${i+1}. ${v.title} - ${v.author}`);
      });
  })
  .catch(e => console.log(e.message));
