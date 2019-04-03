const api = {
    /**
        Returns a promise. Calls $.ajax and passes provided arguments to it
    **/
    _performAjaxCall: (url, type, data = null) => {
        return new Promise((resolve, reject) => {
            $.ajax({
                url,
                type,
                data: {
                    data: JSON.stringify(data),
                },
                dataType: `jsonp`,
                success: (data) => {
                    resolve(data);
                },
                error: (xhr) => {
                    reject(`${xhr.status}: Something bad happened during this API call`);
                }
            });
        });
    },
    _buildOptionalParamUri: (obj, paramNames) => {
        let result = `?`;
        paramNames.forEach((paramName) => {
            if (obj[paramName] !== undefined){
                result += `&${encodeURIComponent(paramName)}=${encodeURIComponent(obj[paramName])}`;
            }
        });
        return result;
    },
    word: {
        add: (wordObj) => {
            return api._performAjaxCall(`/api/word`, `POST`, wordObj);
        },
        delete: (wordId) => {
            return api._performAjaxCall(`/api/word/${encodeURIComponent(wordId)}`, `DELETE`);
        },
        update: (wordId, wordObj) => {
            return api._performAjaxCall(`/api/word/${encodeURIComponent(wordId)}`, `PUT`, wordObj);
        },
    }
};
