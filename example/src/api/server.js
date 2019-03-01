const apiCreate = ajaxinstance => {
    const api = {};
  
    api.getServer = () => {
      return ajaxinstance({
        method: "GET",
        url: "/api/server"
      });
    };
  
    return api;
  };
  
  export default apiCreate;
