import json
from flask import Flask, render_template
from flask_restful import reqparse, abort, Api, Resource

app = Flask(__name__)
api = Api(app)

CATEGORIES = [
	{'name':'food', 'limit':700},
	{'name':'rent', 'limit':1000},
	{'name':'gas', 'limit':150}
]

PURCHASES = []

parser = reqparse.RequestParser()
parser.add_argument('name')
parser.add_argument('limit')

parser.add_argument('amount')
parser.add_argument('date')
parser.add_argument('what')
parser.add_argument('category')

@app.route("/")
def root_page():
	return render_template("base.html")

class CategoryList(Resource):
	def get(self):
		return CATEGORIES, 200

	def post(self):
		#TODO: finish
		args = parser.parse_args()
		print("args")
		print(args)
		exist = False
		for cat in CATEGORIES:
			if cat['name'] == args.name:
				exist = True
				return 'Category already exists', 200

		if not exist:
			CATEGORIES.append({'name':args.name, 'limit': float(args.limit)})
			print(CATEGORIES)
			return 'Added category: ' + args.name, 200
		return 'Something went wrong', 500

class Category(Resource):
	def delete(self, cat_name):
		print("deleting")
		print(cat_name)
		for cat in CATEGORIES:
			if cat['name'] == cat_name:
				CATEGORIES.remove(cat)
				print(CATEGORIES)
				return 'Successfully deleted category: ' + cat_name, 200
		return 'Something went wrong', 500

class PurchaseList(Resource):
	def get(self):
		return PURCHASES, 200

	def put(self):
		#TODO: finish
		args = parser.parse_args()
		PURCHASES.append({'amount':args.amount, 'date':args.date, 'what':args.what, 'category': args.category})
		print("purchases")
		print(PURCHASES)
		return 'Added new purchase: ' + args.what, 200

api.add_resource(CategoryList, '/cats')
api.add_resource(Category, '/cats/<cat_name>')

api.add_resource(PurchaseList, '/purchases')

if __name__ == '__main__':
	app.run(debug=true)
