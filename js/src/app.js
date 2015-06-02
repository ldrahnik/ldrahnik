$(function(){

    // basic data
    var data = {
        nodes:  [
            {
                id: 1,
                label: "github",
                url: "https://github.com/"
            }
        ],
        edges: [

        ]
    };

    appendGithubData('ldrahnik', 1, true);
    appendGithubData('anee', 1, false);

    function appendGithubData(username, parentNode, bool_gists) {

            var requri = 'https://api.github.com/users/' + username;
            var reposuri = 'https://api.github.com/users/' + username + '/repos';
            var gistsuri = 'https://api.github.com/users/' + username + '/gists';

            requestJSON(requri, function (json) {
                if (json.message != "Not Found") {

                    var userNode = json.id;
                    var reposNode = json.id + 1;
                    var gistsNode = json.id + 2;

                    var nodesGithub = [
                        {
                            id: userNode,
                            label: username,
                            url: json.html_url,
                            description: json.bio
                        },
                        {
                            id: reposNode,
                            label: 'repos',
                            url: 'https://github.com/' + username
                        }
                    ];
                    var edgesGithub = [
                        {
                            from: parentNode,
                            to: userNode
                        },
                        {
                            from: userNode,
                            to: reposNode
                        }
                    ];

                    if(bool_gists) {
                        nodesGithub = nodesGithub.concat( {
                            id: gistsNode,
                            label: 'gists',
                            url: 'https://gist.github.com/' + username
                        });
                        edgesGithub = edgesGithub.concat( {
                            from: userNode,
                            to: gistsNode
                        });
                    }

                    var repositories;
                    $.getJSON(reposuri, function (json) {
                        repositories = json;
                        addRepositories();
                    });

                    function addRepositories() {
                        $.each(repositories, function (index) {
                            if (repositories[index].fork == false) {
                                var repo = repositories[index];

                                nodesGithub = nodesGithub.concat(
                                    {
                                        id: repo.id,
                                        label: repo.name,
                                        url: repo.html_url,
                                        description: repo.description
                                    }
                                );
                                edgesGithub = edgesGithub.concat(
                                    {
                                        from: reposNode,
                                        to: repo.id
                                    }
                                );
                            }
                        });

                        if(bool_gists) {
                            var gists;
                            $.getJSON(gistsuri, function (json) {
                                gists = json;
                                addGists();
                            });

                            function addGists() {
                                $.each(gists, function (index) {
                                    var gist = gists[index];

                                    var description = '...';
                                    if (gist.description) {
                                        description = gist.description.substr(0, 12) + '...';
                                    }

                                    nodesGithub = nodesGithub.concat(
                                        {
                                            id: gist.id,
                                            label: description,
                                            url: gist.html_url,
                                            description: gist.description
                                        }
                                    );
                                    edgesGithub = edgesGithub.concat(
                                        {
                                            from: gistsNode,
                                            to: gist.id
                                        }
                                    );
                                });
                                addToNetwork(nodesGithub, edgesGithub);
                            }
                        } else {
                            addToNetwork(nodesGithub, edgesGithub);
                        }
                    }
                }
            });

    }

    function requestJSON(url, callback) {
        $.ajax({
            url: url,
            complete: function(xhr) {
                callback.call(null, xhr.responseJSON);
            }
        });
    }

    function addToNetwork(nodes, edges) {
        data = {
            nodes: data['nodes'].concat(nodes),
            edges: data['edges'].concat(edges)
        };
        createNetwork(data);
    }

    function createNetwork(data) {
        var container = document.getElementById('network-map');

        var options = {
            nodes: {
                color: {
                    background: '#6c7486',
                    highlight: '#959cad'
                }
            },
            zoomable: false,
            dragNetwork: false
        };

        var network = new vis.Network(container, data, options);

        network.on('click', function (properties) {
            var node;
            for(var i=0; i< data['nodes'].length; i++) {
                if(data['nodes'][i].id == properties['nodes'][0]) {
                    node = data['nodes'][i];
                }
            }

            if(node) {
                var infoHtml = '<a href="' + node.url + '">' + node.label + '</a>';
                $('#node-info').html(infoHtml);
                if(node.description != undefined) {
                    var descriptionHtml = '<span style="color: #959bae;">' + node.description + '</span>';
                    $('#node-info-description').html(descriptionHtml);
                } else {
                    $('#node-info-description').html('');
                }
            }
        });
    }
});