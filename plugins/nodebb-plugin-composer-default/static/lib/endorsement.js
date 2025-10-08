'use strict';

define('endorsement', ['hooks'], function (hooks) {
    const Endorsement = {};

    Endorsement.init = function () {
        console.log('Endorsement module initialized');
        Endorsement.addStyles();
        Endorsement.bindEvents();
        
        // Check for existing endorsements on page load
        setTimeout(function() {
            Endorsement.checkAllPostsForEndorsements();
        }, 1000);
    };

    Endorsement.bindEvents = function () {
        // Listen for real-time endorsement updates from server
        socket.on('event:endorsement_updated', function (data) {
            console.log('Socket endorsement update:', data);
            Endorsement.updatePostEndorsement(data);
        });

        // Listen for NodeBB's post data updates (this is the key!)
        $(window).on('action:posts.loaded', function (ev, data) {
            console.log('Posts loaded event:', data);
            if (data && data.posts) {
                data.posts.forEach(function(post) {
                    if (post.upvotes > 0) {
                        Endorsement.showEndorsementBadge(post.pid, post.upvotes);
                    } else {
                        Endorsement.removeEndorsementBadge(post.pid);
                    }
                });
            }
        });

        // Listen for the post update event that happens after voting
        $(window).on('action:post.loaded', function (ev, data) {
            console.log('Post loaded event:', data);
            if (data && data.pid) {
                if (data.upvotes > 0) {
                    Endorsement.showEndorsementBadge(data.pid, data.upvotes);
                } else {
                    Endorsement.removeEndorsementBadge(data.pid);
                }
            }
        });

        // Try to hook into the actual vote success callback
        $(window).on('action:post.upvoted', function (ev, data) {
            console.log('Post upvoted event:', data);
            if (data && data.post) {
                // The post object should have updated vote counts
                setTimeout(function() {
                    if (data.post.upvotes > 0) {
                        Endorsement.showEndorsementBadge(data.post.pid, data.post.upvotes);
                    }
                }, 100);
            }
        });

        $(window).on('action:post.unupvoted', function (ev, data) {
            console.log('Post unupvoted event:', data);
            if (data && data.post) {
                setTimeout(function() {
                    if (data.post.upvotes > 0) {
                        Endorsement.showEndorsementBadge(data.post.pid, data.post.upvotes);
                    } else {
                        Endorsement.removeEndorsementBadge(data.post.pid);
                    }
                }, 100);
            }
        });

        // Hook into socket events for votes (more reliable)
        if (typeof socket !== 'undefined') {
            socket.on('event:post_upvoted', function(data) {
                console.log('Socket post upvoted:', data);
                if (data && data.post && data.post.upvotes > 0) {
                    Endorsement.showEndorsementBadge(data.post.pid, data.post.upvotes);
                }
            });

            socket.on('event:post_unvoted', function(data) {
                console.log('Socket post unvoted:', data);
                if (data && data.post) {
                    if (data.post.upvotes > 0) {
                        Endorsement.showEndorsementBadge(data.post.pid, data.post.upvotes);
                    } else {
                        Endorsement.removeEndorsementBadge(data.post.pid);
                    }
                }
            });
        }

        // Monitor DOM changes in vote count displays as fallback
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.target && mutation.target.className && 
                    (mutation.target.className.includes('vote') || 
                     mutation.target.getAttribute('component') === 'post/vote-count')) {
                    
                    const $post = $(mutation.target).closest('[component="post"]');
                    if ($post.length) {
                        const pid = $post.data('pid');
                        if (pid) {
                            console.log('Vote count changed for post', pid);
                            setTimeout(function() {
                                Endorsement.checkPostEndorsement(pid);
                            }, 100);
                        }
                    }
                }
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
            characterData: true
        });

        // Check on page navigation
        $(window).on('action:ajaxify.end', function() {
            setTimeout(function() {
                Endorsement.checkAllPostsForEndorsements();
            }, 500);
        });
    };

    Endorsement.checkAllPostsForEndorsements = function() {
        console.log('Checking all posts for endorsements');
        $('[component="post"]').each(function() {
            const $post = $(this);
            const pid = $post.data('pid');
            if (pid) {
                Endorsement.checkPostEndorsement(pid);
            }
        });
    };

    Endorsement.checkPostEndorsement = function(pid) {
        const $post = $('[component="post"][data-pid="' + pid + '"]');
        if (!$post.length) return;

        // Try to get upvotes from the post's data attributes first
        let upvotes = parseInt($post.attr('data-upvotes')) || 0;
        
        // If that doesn't work, look for vote display elements
        if (upvotes === 0) {
            const $voteElements = $post.find('[component="post/vote-count"], .vote-count, [data-votes]');
            $voteElements.each(function() {
                const $el = $(this);
                const votes = parseInt($el.text()) || parseInt($el.attr('data-votes')) || 0;
                if (votes > 0) {
                    upvotes = votes;
                    return false; // break
                }
            });
        }

        console.log('Post', pid, 'upvotes:', upvotes);
        
        if (upvotes > 0) {
            Endorsement.showEndorsementBadge(pid, upvotes);
        } else {
            Endorsement.removeEndorsementBadge(pid);
        }
    };

    Endorsement.updatePostEndorsement = function(data) {
        console.log('Updating post endorsement from socket:', data);
        if (data.hasEndorsement && data.upvotes > 0) {
            Endorsement.showEndorsementBadge(data.pid, data.upvotes);
        } else {
            Endorsement.removeEndorsementBadge(data.pid);
        }
    };

    // add helper to map upvotes -> level
    Endorsement.getEndorsementLevel = function (upvotes) {
        if (upvotes >= 6) {
            return 'high';
        }
        if (upvotes >= 3) {
            return 'very-helpful';
        }
        if (upvotes >= 1) {
            return 'good';
        }
        return 'none';
    };

    Endorsement.showEndorsementBadge = function (pid, upvotes) {
        const $post = $('[component="post"][data-pid="' + pid + '"]');
        
        // Remove existing badge first
        $post.find('.endorsement-badge').remove();
        
        if ($post.length && upvotes > 0) {
            const level = Endorsement.getEndorsementLevel(upvotes);
            const labels = {
                good: 'Good',
                'very-helpful': 'Very Helpful',
                high: 'Highly Endorsed'
            };
            const $badge = $('<span>')
                .addClass('endorsement-badge endorsement-' + level)
                .attr('title', upvotes + ' upvote' + (upvotes === 1 ? '' : 's'))
                .text(labels[level] || 'Endorsed');
            
            // Try to find the username or post info area
            let $target = $post.find('[component="post/header"] [itemprop="author"]').parent();
            if (!$target.length) {
                $target = $post.find('[component="post/header"]');
            }
            if (!$target.length) {
                $target = $post.find('.post-header');
            }
            
            if ($target.length) {
                $target.append($badge);
                console.log('Added endorsement badge to post', pid);
            }
        }
    };

    Endorsement.removeEndorsementBadge = function(pid) {
        const $post = $('[component="post"][data-pid="' + pid + '"]');
        $post.find('.endorsement-badge').remove();
    };

    Endorsement.addStyles = function () {
        if (!$('#endorsement-styles').length) {
            $('<style id="endorsement-styles">')
                .text(`
                    .endorsement-badge {
                        display: inline-block;
                        padding: 3px 8px;
                        margin-left: 8px;
                        border-radius: 12px;
                        font-size: 0.8rem;
                        font-weight: 600;
                        color: #fff;
                        vertical-align: middle;
                        letter-spacing: 0.02em;
                    }
                    .endorsement-badge.endorsement-good {
                        background: linear-gradient(90deg,#2ecc71,#27ae60);
                        box-shadow: 0 1px 0 rgba(0,0,0,0.05);
                    }
                    .endorsement-badge.endorsement-very-helpful {
                        background: linear-gradient(90deg,#6a11cb,#2575fc);
                        box-shadow: 0 2px 6px rgba(37,117,252,0.12);
                    }
                    .endorsement-badge.endorsement-high {
                        background: linear-gradient(90deg,#ff9966,#ff5e62);
                        box-shadow: 0 2px 8px rgba(255,94,98,0.12);
                    }
                `)
                .appendTo('head');
        }
    };

    return Endorsement;
});