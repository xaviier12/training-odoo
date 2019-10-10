odoo.define('awesome_tshirt.OrderKanbanView', function (require) {
    "use strict";

    const viewRegistry = require('web.view_registry');
    const KanbanView = require('web.KanbanView');
    const KanbanController = require('web.KanbanController');

    const { qweb } = require('web.core');

    const OrderKanbanController = KanbanController.extend({
        events: {
            'click .o_customer': '_onClickCustomer',
            'input .o_customer_search': '_onCustomerSearchInput',
        },
        init: function () {
            this._super.apply(this, arguments);
            this.activeCustomerID = false;
        },
        willStart: function () {
            return Promise.all([
                this._super.apply(this, arguments),
                this._loadCustomers()
            ])
        },
        start: function () {
            this._render();
            return this._super.apply(this, arguments);
        },
        reload: function (params) {
            if (this.activeCustomerID) {
                params = params || {};
                params.domain = params.domain || [];
                params.domain.push(['customer_id', '=', this.activeCustomerID]);
            }

            console.log(this.activeCustomerID);

            return Promise.all([
                this._super(params),
                this._loadCustomers()
            ]);
        },
        /**
         * @override
         */
        _update: function () {
            return this._super.apply(this, arguments).then(() => this._renderCustomerList());
        },
         /**
         * @private
         * @returns {Promise}
         */
        _loadCustomers: function (domain) {
            return this._rpc({
                route: '/web/dataset/search_read',
                model: 'res.partner',
                fields: ['display_name'],
                domain: [['has_active_order', '=', true]].concat(domain || []),
            }).then(({ records }) => {
                this.customers = records;
            });
        },
        _onClickCustomer: function (event) {
            this.activeCustomerID = this.$el.find(event.currentTarget).data('id');
            this.reload();
        },
        /**
         * Updates the customer list according to the currnet search and active id
         *
         * @private
         */
        _updateCustomerList: function () {
            var searchVal = this.$('.o_customer_search').val();
            var matches = fuzzy.filter(searchVal, _.pluck(this.customers, 'display_name'));
            var indexes = _.pluck(matches, 'index');
            var customers = _.map(indexes, (index) => this.customers[index]);
            this.$('.o_customer_list').html(qweb.render('awesome_tshirt.KanbanView.Customers', {
                activeCustomerID: this.activeCustomerID,
                customers,
            }));
        },
         /**
         * @private
         */
        _onCustomerSearchInput: function () {
            this._updateCustomerList();
        },
        _render: function () {
            this.$el.addClass('o_order_kanban_view');
            this.$el.find('.o_content')
                .prepend(qweb.render('awesome_tshirt.KanbanView', { 
                    activeCustomerID: this.activeCustomerID,
                    customers: this.customers
                }));
        },
        _renderCustomerList: function () {
            this.$el.find('.o_customer_list').html(qweb.render('awesome_tshirt.KanbanView.Customers', {
                activeCustomerID: this.activeCustomerID,
                customers: this.customers
            }));
        },
    });

    const OrderKanbanView = KanbanView.extend({
        config: _.extend({}, KanbanView.prototype.config, {
            Controller: OrderKanbanController,
        }),
    });

    viewRegistry.add('order_kanban_view', OrderKanbanView);
    
    return OrderKanbanView;
});
