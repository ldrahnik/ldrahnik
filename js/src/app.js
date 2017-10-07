$(function () {

    var nodes = [];
    var edges = [];

    var githubNode = 1;
    var username = 'ldrahnik';

    addNode(githubNode, 'github', 'http://github.com/', '');

    appendGithubReposForUsername(username, githubNode);

    function appendGithubReposForUsername(username, parentNode) {
      var userUrl = getAPIUserUrl(username);

      requestJSON(userUrl, function (githubUser) {
        if (githubUser && githubUser.message != "Not Found") {

          var userNode = githubUser.id;
          var gistsNode = githubUser.id + 1;

          addNode(userNode, username, githubUser.html_url, githubUser.bio);
          addNode(gistsNode, 'gists', getGistUserUrl(username), '');

          addEdge(parentNode, userNode);
          addEdge(githubNode, gistsNode);

          // all user -> repos
          $.getJSON(githubUser.repos_url, function (json) {
            addRepos(json, userNode);
          });

          // all user -> orgs -> repos
          $.getJSON(githubUser.organizations_url, function (orgs) {
            $.each(orgs, function (index, org) {
              addOrgsRepos(org, userNode);
            });
          });

          // all event -> orgs -> repos (contribution)
          $.getJSON(getGithubUserEventUrl(username), function (events) {
              $.each(events, function (index, event) {
                  if(event.org) {
                      addOrgsRepos(event.org, userNode);
                  }
              });
          });

          // all user -> gists
          var gistsUrl = getAPIUserGistsUrl(username);
          $.getJSON(gistsUrl, function (json) {
            addGists(json, gistsNode);
          });
        }
      });
    }

    function getGithubUserEventUrl(username) {
      return 'https://api.github.com/users/' + username + '/events';
    }

    function getAPIUserGistsUrl(username) {
      return 'https://api.github.com/users/' + username + '/gists';
    }

    function getAPIUserUrl(username) {
      return 'https://api.github.com/users/' + username;
    }

    function getOrganizationUrl(orgName) {
      return 'https://github.com/' + orgName;
    }

    function getGistUserUrl(username) {
      return 'https://gist.github.com/' + username;
    }

    function getOrganizationReposUrl(org) {
      return 'https://api.github.com/orgs/' + org.login + '/repos';
    }

    function addNode(id, label, url, description) {
        var found = false;
        for(var i = 0; i < nodes.length; i++) {
            if (nodes[i].id == id) {
                found = true;
                break;
            }
        }

        if(!found) {
            nodes = nodes.concat(
                {
                    id: id,
                    label: label,
                    url: url,
                    description: description
                }
            );
        }
    }

    function addEdge(from, to) {
        var found = false;
        for (var i = 0; i < edges.length; i++) {
            if (edges[i].from == from && edges[i].to == to) {
                found = true;
                break;
            }
        }

        if (!found) {
            edges = edges.concat(
                {
                    from: from,
                    to: to
                }
            );
        }
    }

    function isUserLoginAndUsernameIdentical(user) {
      return user.login === username;
    }

    function isOwner(repo) {
      return isUserLoginAndUsernameIdentical(repo.owner);
    }

    function ifIsContributor(repo, callback) {
      requestJSON(repo.contributors_url, function (contributors) {
        if (contributors.find(isUserLoginAndUsernameIdentical)) {
          callback();
        }
      });
    }

    function isRepoOwnerOrContributor(repo, callback) {
      if (isOwner(repo)) {
        callback();
      } else {
        ifIsContributor(repo, callback);
      }
    }

    function addRepo(repo, parentNode) {
      isRepoOwnerOrContributor(repo, function () {
        addNode(repo.id, repo.name, repo.html_url, repo.description);
        addEdge(parentNode, repo.id);
        createNetwork();
      });
    }

    function addRepos(repos, parentNode) {
      $.each(repos, function (index, repo) {
        if (repo.fork == false) {
          addRepo(repo, parentNode);
        }
      });
    }

    function addOrgsRepos(org, parentNode) {
      addNode(org.id, org.login, getOrganizationUrl(org.login), org.description);
      addEdge(parentNode, org.id);

      $.getJSON(getOrganizationReposUrl(org), function (orgRepos) {
        addRepos(orgRepos, org.id);
      });
    }

    function addGists(gists, parentNode) {
      $.each(gists, function (index, gist) {
        var label = '...';
        if (gist.description) {
          label = gist.description.substr(0, 12) + '...';
        }
        addNode(gist.id, label, gist.html_url, gist.description);
        addEdge(parentNode, gist.id);
      });
    }

    function requestJSON(url, callback) {
      $.ajax({
        url: url,
        complete: function (xhr) {
          callback.call(null, xhr.responseJSON);
        }
      });
    }

    function createNetwork() {
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

      var data = {
        nodes: nodes,
        edges: edges
      };
      var network = new vis.Network(container, data, options);

      network.on('click', function (properties) {
        var node;
        for (var i = 0; i < data['nodes'].length; i++) {
          if (data['nodes'][i].id == properties['nodes'][0]) {
            node = data['nodes'][i];
          }
        }

        if (node) {
          var infoHtml = '<a href="' + node.url + '">' + node.label + '</a>';
          $('#node-info').html(infoHtml);
          if (node.description != undefined) {
            var descriptionHtml = '<span style="color: #959bae;">' + node.description + '</span>';
            $('#node-info-description').html(descriptionHtml);
          } else {
            $('#node-info-description').html('');
          }
        }
      });
    }

  }
);